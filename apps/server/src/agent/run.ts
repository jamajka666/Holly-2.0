import { addAudit } from "../lib/audit.js";
import { shellNeedsConfirm } from "../lib/security.js";
import { fsList, fsRead, fsWrite, listWorkspaceRoots } from "../tools/fs.js";
import { shellExec } from "../tools/shell.js";
import { fsSearch } from "../tools/search.js";
import { gitDiff, gitStatus } from "../tools/git.js";
import {
  clipboardGet,
  clipboardSet,
  desktopNotify,
  openUrl,
} from "../tools/desktop.js";
import { kaliPing, kaliRun, kaliStatus } from "../kali/ssh.js";
import {
  ollamaAvailable,
  ollamaChat,
  systemPrompt,
  type ChatMessage,
} from "./ollama.js";

export type AgentStep = {
  kind: "tool" | "reply" | "llm" | "info" | "confirm";
  name?: string;
  input?: unknown;
  output?: unknown;
  text?: string;
};

export type PendingTool = {
  name: ToolName;
  args: Record<string, unknown>;
};

export type AgentResult = {
  reply: string;
  steps: AgentStep[];
  mode: "ollama" | "heuristic";
  model?: string;
  needsConfirm?: boolean;
  pending?: PendingTool;
};

type ToolName =
  | "fs_list"
  | "fs_read"
  | "fs_write"
  | "fs_search"
  | "git_status"
  | "git_diff"
  | "shell_exec"
  | "open_url"
  | "notify"
  | "clipboard_get"
  | "clipboard_set"
  | "kali_status"
  | "kali_run";

type Parsed =
  | { type: "tool"; name: ToolName; args: Record<string, unknown> }
  | { type: "reply"; text: string }
  | { type: "text"; text: string };

export type RunAgentOptions = {
  confirm?: boolean;
  pending?: PendingTool | null;
};

const MAX_STEPS = 6;

const TOOLS_ALWAYS_CONFIRM = new Set<ToolName>(["fs_write"]);

function extractJsonObjects(text: string): unknown[] {
  const out: unknown[] = [];
  const trimmed = text.trim();
  try {
    out.push(JSON.parse(trimmed));
    return out;
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      out.push(JSON.parse(fence[1].trim()));
      return out;
    } catch {
      /* continue */
    }
  }
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

function toolNeedsConfirm(name: ToolName, args: Record<string, unknown>): boolean {
  if (TOOLS_ALWAYS_CONFIRM.has(name)) return true;
  if (name === "shell_exec") {
    return shellNeedsConfirm(String(args.command ?? ""));
  }
  if (name === "kali_run") {
    // medium/high profiles enforce confirm inside kaliRun; still gate agent UX
    const profile = String(args.profile ?? "");
    return profile !== "sysinfo" && profile !== "whoami";
  }
  return false;
}

async function executeTool(
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
    case "fs_search":
      return fsSearch(String(args.query ?? ""), String(args.path ?? "."));
    case "git_status":
      return gitStatus();
    case "git_diff":
      return gitDiff({
        staged: Boolean(args.staged),
        path: args.path ? String(args.path) : undefined,
      });
    case "shell_exec":
      return shellExec(String(args.command ?? ""));
    case "open_url":
      return openUrl(String(args.url ?? ""));
    case "notify":
      return desktopNotify(String(args.title ?? "Holly"), String(args.body ?? ""));
    case "clipboard_get":
      return clipboardGet();
    case "clipboard_set":
      return clipboardSet(String(args.text ?? ""));
    case "kali_status":
      return { ...kaliStatus(), ping: await kaliPing() };
    case "kali_run": {
      const profile = String(args.profile ?? "");
      const rawArgs = (args.args as Record<string, string>) || {};
      // flatten host/target convenience
      const flat: Record<string, string> = { ...rawArgs };
      if (args.host) flat.host = String(args.host);
      if (args.target) flat.target = String(args.target);
      return kaliRun(profile, flat, { confirm: Boolean(args.confirm) });
    }
    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

async function runToolGated(
  name: ToolName,
  args: Record<string, unknown>,
  confirm: boolean,
): Promise<
  | { status: "ok"; output: unknown }
  | { status: "needs_confirm"; pending: PendingTool }
> {
  if (toolNeedsConfirm(name, args) && !confirm) {
    addAudit("TOOL_NEEDS_CONFIRM", "owner", { name, argsPreview: JSON.stringify(args).slice(0, 200) });
    return { status: "needs_confirm", pending: { name, args } };
  }
  const execArgs =
    name === "kali_run" && confirm
      ? { ...args, confirm: true }
      : args;
  const output = await executeTool(name, execArgs);
  // kali_run may still return needsConfirm from bridge
  if (
    name === "kali_run" &&
    output &&
    typeof output === "object" &&
    "needsConfirm" in output &&
    (output as { needsConfirm?: boolean }).needsConfirm
  ) {
    return {
      status: "needs_confirm",
      pending: { name, args: { ...args, confirm: true } },
    };
  }
  return { status: "ok", output };
}

function formatToolReply(output: unknown): string {
  return "```json\n" + JSON.stringify(output, null, 2).slice(0, 6000) + "\n```";
}

/** Simple intent router when Ollama is offline. */
async function heuristicRun(
  message: string,
  opts: RunAgentOptions,
): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const confirm = !!opts.confirm;

  if (opts.pending && confirm) {
    const gated = await runToolGated(opts.pending.name, opts.pending.args, true);
    if (gated.status === "ok") {
      steps.push({
        kind: "tool",
        name: opts.pending.name,
        input: opts.pending.args,
        output: gated.output,
      });
      return {
        mode: "heuristic",
        reply: `Potvrzeno · ${opts.pending.name}\n${formatToolReply(gated.output)}`,
        steps,
      };
    }
  }

  const m = message.trim();
  const lower = m.toLowerCase();

  const runMatch =
    m.match(/^(?:run|spus[tť]|exec)\s*[:`]?\s*(.+)$/i) || m.match(/^`(.+)`$/);
  if (runMatch?.[1]) {
    const command = runMatch[1].replace(/^`|`$/g, "").trim();
    const gated = await runToolGated("shell_exec", { command }, confirm);
    if (gated.status === "needs_confirm") {
      steps.push({ kind: "confirm", name: "shell_exec", input: { command } });
      return {
        mode: "heuristic",
        needsConfirm: true,
        pending: gated.pending,
        reply: `Potřebuji potvrzení pro shell:\n\`${command}\`\n\nStiskni **Potvrdit** v UI.`,
        steps,
      };
    }
    steps.push({
      kind: "tool",
      name: "shell_exec",
      input: { command },
      output: gated.output,
    });
    return { mode: "heuristic", reply: formatToolReply(gated.output), steps };
  }

  const writeMatch = m.match(
    /^(?:write|zapiš|zapis)\s+(\S+)\s+<<<\s*([\s\S]+)$/i,
  );
  if (writeMatch) {
    const path = writeMatch[1]!;
    const content = writeMatch[2]!;
    const gated = await runToolGated("fs_write", { path, content }, confirm);
    if (gated.status === "needs_confirm") {
      steps.push({ kind: "confirm", name: "fs_write", input: { path, content: content.slice(0, 80) } });
      return {
        mode: "heuristic",
        needsConfirm: true,
        pending: gated.pending,
        reply: `Potřebuji potvrzení pro zápis do \`${path}\`.\nStiskni **Potvrdit**.`,
        steps,
      };
    }
    steps.push({
      kind: "tool",
      name: "fs_write",
      input: { path },
      output: gated.output,
    });
    return { mode: "heuristic", reply: formatToolReply(gated.output), steps };
  }

  const searchMatch = m.match(/^(?:search|najdi|grep|find)\s+(.+)$/i);
  if (searchMatch?.[1]) {
    const query = searchMatch[1].trim();
    const output = await fsSearch(query);
    steps.push({ kind: "tool", name: "fs_search", input: { query }, output });
    if (!output.ok) {
      return { mode: "heuristic", reply: `Chyba: ${output.error}`, steps };
    }
    const lines = output.hits
      .map((h) => `${h.path}:${h.line}: ${h.text}`)
      .join("\n");
    return {
      mode: "heuristic",
      reply: `Search "${query}" (${output.engine}, ${output.hits.length} hits):\n${lines || "(none)"}`,
      steps,
    };
  }

  if (/^git\s+status$/i.test(lower) || lower === "git status") {
    const output = await gitStatus();
    steps.push({ kind: "tool", name: "git_status", output });
    return {
      mode: "heuristic",
      reply: output.ok ? output.output : `Chyba: ${output.error}`,
      steps,
    };
  }

  if (/^git\s*diff/i.test(m) || lower === "diff") {
    const path = m.replace(/^git\s*diff\s*/i, "").trim() || undefined;
    const output = await gitDiff({ path });
    steps.push({ kind: "tool", name: "git_diff", input: { path }, output });
    return {
      mode: "heuristic",
      reply: output.ok ? "```\n" + output.output.slice(0, 4000) + "\n```" : `Chyba: ${"error" in output ? output.error : "?"}`,
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

  const openMatch = m.match(/^(?:open|otevři|otevri)\s+(https?:\/\/\S+)/i);
  if (openMatch?.[1]) {
    const url = openMatch[1];
    const output = await openUrl(url);
    steps.push({ kind: "tool", name: "open_url", input: { url }, output });
    return {
      mode: "heuristic",
      reply: output.ok ? `Otevřeno: ${url}` : `Chyba: ${output.error}`,
      steps,
    };
  }

  const notifyMatch = m.match(/^(?:notify|upozorni|toast)\s+(.+)$/i);
  if (notifyMatch?.[1]) {
    const rest = notifyMatch[1].trim();
    const [title, ...bodyParts] = rest.split("|");
    const output = await desktopNotify(title!.trim(), bodyParts.join("|").trim());
    steps.push({
      kind: "tool",
      name: "notify",
      input: { title: title!.trim() },
      output,
    });
    return {
      mode: "heuristic",
      reply: output.ok ? `Notifikace odeslána: ${title}` : `Chyba: ${output.error}`,
      steps,
    };
  }

  if (/^clipboard\s*get$/i.test(lower) || /^clip\s*get$/i.test(lower)) {
    const output = await clipboardGet();
    steps.push({ kind: "tool", name: "clipboard_get", output });
    return {
      mode: "heuristic",
      reply: output.ok
        ? `Clipboard (${output.backend}):\n${output.text.slice(0, 2000)}`
        : `Chyba: ${output.error}`,
      steps,
    };
  }

  const clipSet = m.match(/^(?:clipboard\s*set|clip\s*set)\s+([\s\S]+)$/i);
  if (clipSet?.[1]) {
    const text = clipSet[1];
    const output = await clipboardSet(text);
    steps.push({ kind: "tool", name: "clipboard_set", input: { bytes: text.length }, output });
    return {
      mode: "heuristic",
      reply: output.ok
        ? `Clipboard nastaven (${output.backend}, ${output.bytes} B)`
        : `Chyba: ${output.error}`,
      steps,
    };
  }

  if (/^kali\s*status$/i.test(lower) || lower === "kali") {
    const output = { ...kaliStatus(), ping: await kaliPing() };
    steps.push({ kind: "tool", name: "kali_status", output });
    return {
      mode: "heuristic",
      reply: formatToolReply(output),
      steps,
    };
  }

  const kaliRunMatch = m.match(
    /^kali\s+run\s+(\w+)(?:\s+(.+))?$/i,
  );
  if (kaliRunMatch) {
    const profile = kaliRunMatch[1]!;
    const rest = (kaliRunMatch[2] || "").trim();
    const args: Record<string, string> = {};
    if (rest) {
      if (profile === "ping" || profile === "nmap_top_ports") args.host = rest.split(/\s+/)[0]!;
      else if (profile === "nmap_ping_scan") args.target = rest.split(/\s+/)[0]!;
    }
    const gated = await runToolGated(
      "kali_run",
      { profile, ...args, args },
      confirm,
    );
    if (gated.status === "needs_confirm") {
      steps.push({ kind: "confirm", name: "kali_run", input: { profile, args } });
      return {
        mode: "heuristic",
        needsConfirm: true,
        pending: gated.pending,
        reply: `Potřebuji potvrzení pro Kali profile **${profile}**.\nStiskni **Potvrdit**.`,
        steps,
      };
    }
    steps.push({
      kind: "tool",
      name: "kali_run",
      input: { profile, args },
      output: gated.output,
    });
    return { mode: "heuristic", reply: formatToolReply(gated.output), steps };
  }

  return {
    mode: "heuristic",
    reply:
      "Heuristický režim (Ollama down). Příkazy:\n" +
      "• `list` / `read` / `search` / `git status` / `git diff`\n" +
      "• `run ls -la` · `write path <<< content` (confirm)\n" +
      "• `open https://…` · `notify Title | body`\n" +
      "• `clipboard get` / `clipboard set text`\n" +
      "• `kali status` · `kali run sysinfo` · `kali run ping 1.1.1.1` (confirm)\n" +
      "• `workspace`",
    steps: [{ kind: "info", text: "fallback help" }],
  };
}

export async function runAgent(
  message: string,
  history: ChatMessage[] = [],
  opts: RunAgentOptions = {},
): Promise<AgentResult> {
  addAudit("AGENT_CHAT", "owner", {
    messagePreview: message.slice(0, 200),
    confirm: !!opts.confirm,
  });

  const hasOllama = await ollamaAvailable();
  if (!hasOllama) {
    return heuristicRun(message, opts);
  }

  const roots = listWorkspaceRoots();
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const steps: AgentStep[] = [];
  const confirm = !!opts.confirm;

  // Direct confirmed pending tool from UI
  if (opts.pending && confirm) {
    const gated = await runToolGated(opts.pending.name, opts.pending.args, true);
    if (gated.status === "ok") {
      steps.push({
        kind: "tool",
        name: opts.pending.name,
        input: opts.pending.args,
        output: gated.output,
      });
      return {
        mode: "ollama",
        model,
        reply: `Potvrzeno · ${opts.pending.name}\n${formatToolReply(gated.output)}`,
        steps,
      };
    }
  }

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
      const gated = await runToolGated(parsed.name, parsed.args, confirm && i === 0);
      // Only the first tool in a confirm pass is auto-confirmed; subsequent writes still need confirm
      if (gated.status === "needs_confirm") {
        steps.push({
          kind: "confirm",
          name: parsed.name,
          input: parsed.args,
        });
        return {
          mode: "ollama",
          model,
          needsConfirm: true,
          pending: gated.pending,
          reply: `Potřebuji tvé potvrzení pro **${parsed.name}**.\n\nStiskni **Potvrdit** v UI, nebo akci zruš.`,
          steps,
        };
      }
      steps.push({
        kind: "tool",
        name: parsed.name,
        input: parsed.args,
        output: gated.output,
      });
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `Tool ${parsed.name} result:\n${JSON.stringify(gated.output).slice(0, 8000)}\nContinue. Use {"reply":"..."} when done.`,
      });
      // After one confirmed write, further tools in same turn need new confirm
      // (confirm flag only applies to the pending chain from UI)
      continue;
    }

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
