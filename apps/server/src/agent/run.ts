import { addAudit } from "../lib/audit.js";
import { fsList, fsRead, fsWrite, listWorkspaceRoots } from "../tools/fs.js";
import { shellExec } from "../tools/shell.js";
import {
  ollamaAvailable,
  ollamaChat,
  systemPrompt,
  type ChatMessage,
} from "./ollama.js";

export type AgentStep = {
  kind: "tool" | "reply" | "llm" | "info";
  name?: string;
  input?: unknown;
  output?: unknown;
  text?: string;
};

export type AgentResult = {
  reply: string;
  steps: AgentStep[];
  mode: "ollama" | "heuristic";
  model?: string;
};

type ToolName = "fs_list" | "fs_read" | "fs_write" | "shell_exec";

type Parsed =
  | { type: "tool"; name: ToolName; args: Record<string, unknown> }
  | { type: "reply"; text: string }
  | { type: "text"; text: string };

const MAX_STEPS = 6;

function extractJsonObjects(text: string): unknown[] {
  const out: unknown[] = [];
  const trimmed = text.trim();
  // whole message is JSON
  try {
    out.push(JSON.parse(trimmed));
    return out;
  } catch {
    /* continue */
  }
  // fenced ```json
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      out.push(JSON.parse(fence[1].trim()));
      return out;
    } catch {
      /* continue */
    }
  }
  // first {...} block
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      out.push(JSON.parse(trimmed.slice(start, end + 1)));
    } catch {
      /* ignore */
    }
  }
  return out;
}

function parseAssistant(text: string): Parsed {
  for (const obj of extractJsonObjects(text)) {
    if (!obj || typeof obj !== "object") continue;
    const o = obj as Record<string, unknown>;
    if (typeof o.reply === "string") return { type: "reply", text: o.reply };
    if (typeof o.tool === "string") {
      return {
        type: "tool",
        name: o.tool as ToolName,
        args: (o.args as Record<string, unknown>) || {},
      };
    }
  }
  return { type: "text", text };
}

async function runTool(
  name: ToolName,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "fs_list":
      return fsList(String(args.path ?? "."));
    case "fs_read":
      return fsRead(String(args.path ?? ""));
    case "fs_write":
      return fsWrite(String(args.path ?? ""), String(args.content ?? ""));
    case "shell_exec":
      return shellExec(String(args.command ?? ""));
    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

/** Simple intent router when Ollama is offline. */
async function heuristicRun(message: string): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const m = message.trim();
  const lower = m.toLowerCase();

  // shell: run `...` or "spusť: ..."
  const runMatch =
    m.match(/^(?:run|spus[tť]|exec)\s*[:`]?\s*(.+)$/i) ||
    m.match(/^`(.+)`$/);
  if (runMatch?.[1]) {
    const command = runMatch[1].replace(/^`|`$/g, "").trim();
    steps.push({ kind: "tool", name: "shell_exec", input: { command } });
    const output = await shellExec(command);
    steps.push({ kind: "tool", name: "shell_exec", output });
    return {
      mode: "heuristic",
      reply: formatToolReply(output),
      steps,
    };
  }

  const readMatch = m.match(/^(?:read|přečti|precti|cat)\s+(.+)$/i);
  if (readMatch?.[1]) {
    const p = readMatch[1].trim();
    const output = await fsRead(p);
    steps.push({ kind: "tool", name: "fs_read", input: { path: p }, output });
    return {
      mode: "heuristic",
      reply: output.ok
        ? `\`\`\`\n${output.content.slice(0, 4000)}\n\`\`\``
        : `Chyba: ${output.error}`,
      steps,
    };
  }

  if (
    /^(list|ls|soubory|files|dir)\b/i.test(lower) ||
    /co je v|vypiš soubory|vypis soubory/i.test(lower)
  ) {
    const p = m.replace(/^(list|ls|soubory|files|dir)\s*/i, "").trim() || ".";
    const output = await fsList(p);
    steps.push({ kind: "tool", name: "fs_list", input: { path: p }, output });
    if (!output.ok) {
      return { mode: "heuristic", reply: `Chyba: ${output.error}`, steps };
    }
    const lines = output.items
      .map((i) => `${i.type === "dir" ? "📁" : "📄"} ${i.name}`)
      .join("\n");
    return {
      mode: "heuristic",
      reply: `${output.path}\n${lines || "(empty)"}`,
      steps,
    };
  }

  if (/workspace|kořen|koren|roots/i.test(lower)) {
    const roots = listWorkspaceRoots();
    return {
      mode: "heuristic",
      reply: `Povolené workspace roots:\n${roots.map((r) => `- ${r}`).join("\n")}`,
      steps: [{ kind: "info", text: "workspace roots" }],
    };
  }

  return {
    mode: "heuristic",
    reply:
      "Ollama není dostupná — běžím v heuristickém režimu.\n\n" +
      "Zkus:\n" +
      "• `list` nebo `list apps`\n" +
      "• `read README.md`\n" +
      "• `run ls -la`\n" +
      "• `workspace`\n\n" +
      "Pro plný chat spusť Ollama (např. `ollama serve` + model z `OLLAMA_MODEL`).",
    steps: [{ kind: "info", text: "fallback help" }],
  };
}

function formatToolReply(output: unknown): string {
  return "```json\n" + JSON.stringify(output, null, 2).slice(0, 6000) + "\n```";
}

export async function runAgent(
  message: string,
  history: ChatMessage[] = [],
): Promise<AgentResult> {
  addAudit("AGENT_CHAT", "owner", {
    messagePreview: message.slice(0, 200),
  });

  const hasOllama = await ollamaAvailable();
  if (!hasOllama) {
    return heuristicRun(message);
  }

  const roots = listWorkspaceRoots();
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const steps: AgentStep[] = [];
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(roots) },
    ...history.slice(-12),
    { role: "user", content: message },
  ];

  for (let i = 0; i < MAX_STEPS; i++) {
    const raw = await ollamaChat(messages, { model });
    steps.push({ kind: "llm", text: raw.slice(0, 2000) });
    const parsed = parseAssistant(raw);

    if (parsed.type === "reply") {
      addAudit("AGENT_REPLY", "owner", { mode: "ollama", steps: steps.length });
      return { mode: "ollama", model, reply: parsed.text, steps };
    }

    if (parsed.type === "tool") {
      const output = await runTool(parsed.name, parsed.args);
      steps.push({
        kind: "tool",
        name: parsed.name,
        input: parsed.args,
        output,
      });
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `Tool ${parsed.name} result:\n${JSON.stringify(output).slice(0, 8000)}\nContinue. Use {"reply":"..."} when done.`,
      });
      continue;
    }

    // free text from model — treat as final
    addAudit("AGENT_REPLY", "owner", {
      mode: "ollama",
      steps: steps.length,
      freeText: true,
    });
    return { mode: "ollama", model, reply: parsed.text, steps };
  }

  return {
    mode: "ollama",
    model,
    reply: "Dosáhnut limit kroků agenta. Zkus užší dotaz.",
    steps,
  };
}
