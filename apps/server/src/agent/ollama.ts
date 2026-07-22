export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export async function ollamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ollamaChat(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<string> {
  const model = opts.model || OLLAMA_MODEL;
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: opts.temperature ?? 0.2 },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    message?: { content?: string };
  };
  return data.message?.content?.trim() || "";
}

export function systemPrompt(workspaceRoots: string[]): string {
  return `You are Holly 2.0, a personal owner-only assistant on a Linux PC.
You may use tools by emitting a single JSON object on its own line (no markdown fences):

{"tool":"fs_list","args":{"path":"."}}
{"tool":"fs_read","args":{"path":"README.md"}}
{"tool":"fs_write","args":{"path":"notes/tmp.txt","content":"hello"}}
{"tool":"shell_exec","args":{"command":"ls -la"}}

When finished answering the user, emit ONLY:
{"reply":"your final answer in Czech or English matching the user"}

Rules:
- Prefer tools for real filesystem/shell facts; do not invent paths.
- Workspace roots (only these paths): ${workspaceRoots.join(", ")}
- Shell is allowlisted (ls, pwd, git, node, npm, cat, …). Dangerous commands are blocked.
- Never claim you can open Kali or use voice auth until those features exist.
- Keep replies concise and technical.`;
}
