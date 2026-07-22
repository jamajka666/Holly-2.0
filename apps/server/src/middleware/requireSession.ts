import type { Request, Response, NextFunction } from "express";
import { extractBearer, getSession, type Session } from "../lib/session.js";

export type AuthedRequest = Request & { session?: Session };

export function requireSession(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token =
    extractBearer(req.header("authorization") || undefined) ||
    (typeof req.header("x-holly-token") === "string"
      ? req.header("x-holly-token")
      : null);

  const session = getSession(token);
  if (!session) {
    res.status(401).json({
      ok: false,
      error: "unauthorized",
      message: "Platná owner session vyžadována (PIN login).",
    });
    return;
  }
  req.session = session;
  next();
}
