import { Router } from "express";
import { addAudit, recentAudit, subscribeAudit } from "../lib/audit.js";
import { requireSession } from "../middleware/requireSession.js";

export const auditRouter = Router();

auditRouter.get("/audit/recent", requireSession, (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  res.json({ items: recentAudit(limit) });
});

auditRouter.get("/audit/stream", requireSession, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (e: { id: number; event: string; ts: number; user_id: string | null; meta: Record<string, unknown> }) => {
    res.write(`id: ${e.id}\n`);
    res.write(`event: audit\n`);
    res.write(`data: ${JSON.stringify(e)}\n\n`);
  };

  // seed last few
  for (const e of recentAudit(10).reverse()) {
    send(e);
  }

  const hb = setInterval(() => res.write(`: ping ${Date.now()}\n\n`), 15000);
  const unsub = subscribeAudit(send);

  req.on("close", () => {
    clearInterval(hb);
    unsub();
  });
});

auditRouter.get("/audit/test", requireSession, (req, res) => {
  const ev = addAudit("AUTH_TEST", String(req.query.userId || "owner"), {
    via: "/audit/test",
  });
  res.json({ ok: true, ev });
});
