import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  kaliAbort,
  kaliHistory,
  kaliPing,
  kaliRun,
  kaliStatus,
} from "../kali/ssh.js";

export const kaliRouter = Router();

// Status without secrets — still require session (owner-only product)
kaliRouter.get("/kali/status", requireSession, (_req, res) => {
  res.json(kaliStatus());
});

kaliRouter.get("/kali/ping", requireSession, async (_req, res) => {
  res.json(await kaliPing());
});

kaliRouter.get("/kali/history", requireSession, (_req, res) => {
  res.json({ ok: true, items: kaliHistory() });
});

kaliRouter.post("/kali/run", requireSession, async (req, res) => {
  const schema = z.object({
    profile: z.string().min(1).max(64),
    args: z.record(z.string()).optional(),
    confirm: z.boolean().optional(),
  });
  try {
    const body = schema.parse(req.body);
    const result = await kaliRun(body.profile, body.args || {}, {
      confirm: body.confirm,
    });
    const status =
      !result.ok && "needsConfirm" in result && result.needsConfirm
        ? 409
        : result.ok
          ? 200
          : 400;
    res.status(status).json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: "bad_request", details: e.flatten() });
      return;
    }
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "kali_run_failed",
    });
  }
});

/** Kill-switch: abort one job or all active SSH commands. */
kaliRouter.post("/kali/abort", requireSession, (req, res) => {
  const jobId =
    typeof req.body?.jobId === "string" ? req.body.jobId : undefined;
  res.json(kaliAbort(jobId));
});
