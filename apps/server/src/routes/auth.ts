import { Router } from "express";
import { z } from "zod";
import { addAudit } from "../lib/audit.js";

export const authRouter = Router();

const pinSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(4).max(8),
});

authRouter.post("/auth/pin-login", (req, res) => {
  const ownerPin = process.env.OWNER_PIN || "0000";
  try {
    const { userId, pin } = pinSchema.parse(req.body);
    if (pin !== ownerPin) {
      addAudit("AUTH_PIN_FAIL", userId, { reason: "bad_pin" });
      res.status(401).json({ success: false, error: "unauthorized" });
      return;
    }
    addAudit("AUTH_PIN_LOGIN", userId, { ok: true });
    res.json({
      success: true,
      token: `dev-token-${Math.random().toString(36).slice(2)}`,
      owner: true,
    });
  } catch {
    addAudit("AUTH_PIN_FAIL", null, { reason: "bad_request" });
    res.status(400).json({ success: false, error: "bad_request" });
  }
});
