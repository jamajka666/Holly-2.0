import express from "express";
import { addAudit, recentAudit } from "../store.js";

const router = express.Router();
const subs = new Set();

router.get("/audit/recent", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  res.json({ items: recentAudit(limit) });
});

router.get("/audit/stream", (req, res) => {
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");

  const send = (e) => {
    res.write(`id: ${e.id}\n`);
    res.write(`event: ${e.event}\n`);
    res.write(`data: ${JSON.stringify(e)}\n\n`);
  };

  const hb = setInterval(()=>res.write(`: ping ${Date.now()}\n\n`), 15000);
  const sub = { send }; subs.add(sub);

  req.on("close", () => { clearInterval(hb); subs.delete(sub); });
});

// malá utilita pro broadcast z jiných rout
export function broadcast(e) {
  for (const s of subs) { try { s.send(e); } catch {} }
}

// jednoduchý test event (volitelně): GET /audit/test?userId=abc
router.get("/audit/test", (req, res) => {
  const ev = addAudit("AUTH_TEST", String(req.query.userId || null), { via:"/audit/test" });
  broadcast(ev);
  res.json({ ok:true, ev });
});

export default router;
