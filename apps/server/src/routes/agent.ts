import { Router } from "express";
import { z } from "zod";
import { runAgent } from "../agent/run.js";
import { ollamaAvailable } from "../agent/ollama.js";
import { listWorkspaceRoots } from "../tools/fs.js";
import { requireSession } from "../middleware/requireSession.js";

export const agentRouter = Router();

const pendingSchema = z.object({
  name: z.enum([
    "fs_list",
    "fs_read",
    "fs_write",
    "fs_search",
    "git_status",
    "git_diff",
    "shell_exec",
  ]),
  args: z.record(z.unknown()),
});

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(20)
    .optional(),
  confirm: z.boolean().optional(),
  pending: pendingSchema.optional().nullable(),
});

// Status is public (no secrets) so UI can show Ollama/workspace before login
agentRouter.get("/agent/status", async (_req, res) => {
  const ollama = await ollamaAvailable();
  res.json({
    ok: true,
    ollama,
    model: process.env.OLLAMA_MODEL || "llama3.2",
    ollamaUrl: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
    workspaceRoots: listWorkspaceRoots(),
    mode: ollama ? "ollama" : "heuristic",
    authRequired: true,
    voice: "deferred",
  });
});

agentRouter.post("/agent/chat", requireSession, async (req, res) => {
  try {
    const body = chatSchema.parse(req.body);
    const result = await runAgent(body.message, body.history ?? [], {
      confirm: body.confirm,
      pending: body.pending ?? null,
    });
    res.json({
      ok: true,
      reply: result.reply,
      mode: result.mode,
      model: result.model,
      steps: result.steps,
      needsConfirm: result.needsConfirm ?? false,
      pending: result.pending ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: "bad_request", details: e.flatten() });
      return;
    }
    console.error("[agent]", e);
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "agent_failed",
    });
  }
});
