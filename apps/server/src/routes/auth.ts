import { Router } from "express";
import { z } from "zod";
import { addAudit } from "../lib/audit.js";
import {
  createSession,
  extractBearer,
  getSession,
  revokeSession,
} from "../lib/session.js";
import { requireSession, type AuthedRequest } from "../middleware/requireSession.js";

export const authRouter = Router();

const pinSchema = z.object({
  userId: z.string().min(1).default("owner"),
  pin: z.string().min(4).max(8),
});

authRouter.post("/auth/pin-login", (req, res) => {
  const ownerPin = process.env.OWNER_PIN || "0000";
  try {
    const body = pinSchema.parse({
      userId: req.body?.userId ?? "owner",
      pin: req.body?.pin,
    });
    if (body.pin !== ownerPin) {
      addAudit("AUTH_PIN_FAIL", body.userId, { reason: "bad_pin" });
      res.status(401).json({ success: false, error: "unauthorized" });
      return;
    }
    const session = createSession(body.userId);
    addAudit("AUTH_PIN_LOGIN", body.userId, { ok: true });
    res.json({
      success: true,
      token: session.token,
      owner: true,
      expiresAt: session.expiresAt,
      userId: session.userId,
    });
  } catch {
    addAudit("AUTH_PIN_FAIL", null, { reason: "bad_request" });
    res.status(400).json({ success: false, error: "bad_request" });
  }
});

authRouter.post("/auth/logout", (req, res) => {
  const token =
    extractBearer(req.header("authorization") || undefined) ||
    req.header("x-holly-token") ||
    null;
  const ok = revokeSession(token);
  if (ok) addAudit("AUTH_LOGOUT", "owner", {});
  res.json({ success: true, revoked: ok });
});

authRouter.get("/auth/me", requireSession, (req: AuthedRequest, res) => {
  res.json({
    ok: true,
    userId: req.session!.userId,
    owner: true,
    expiresAt: req.session!.expiresAt,
  });
});

authRouter.get("/auth/session", (req, res) => {
  const token =
    extractBearer(req.header("authorization") || undefined) ||
    req.header("x-holly-token") ||
    null;
  const s = getSession(token);
  if (!s) {
    res.status(401).json({ ok: false, authenticated: false });
    return;
  }
  res.json({
    ok: true,
    authenticated: true,
    userId: s.userId,
    expiresAt: s.expiresAt,
  });
});
