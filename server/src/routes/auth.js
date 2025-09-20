import express from "express";
import { z } from "zod";
import { addAudit } from "../store.js";
import { broadcast } from "./audit.js";

const router = express.Router();

router.post("/auth/pin-login", express.json(), (req, res) => {
  const schema = z.object({ userId: z.string().min(1), pin: z.string().min(4).max(8), password: z.string().min(3) });
  try {
    const { userId } = schema.parse(req.body);
    const ev = addAudit("AUTH_PIN_LOGIN", userId, { ok:true });
    broadcast(ev);
    res.json({ success:true, token: "dev-token-"+Math.random().toString(36).slice(2) });
  } catch (e) {
    const ev = addAudit("AUTH_PIN_FAIL", null, { reason: "bad_request" });
    broadcast(ev);
    res.status(400).json({ success:false, error:"bad_request" });
  }
});

export default router;
