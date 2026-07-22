import crypto from "node:crypto";

export type Session = {
  token: string;
  userId: string;
  owner: true;
  createdAt: number;
  expiresAt: number;
};

const TTL_MS = Number(process.env.SESSION_TTL_MS || 12 * 60 * 60 * 1000); // 12h
const sessions = new Map<string, Session>();

export function createSession(userId: string): Session {
  const token = crypto.randomBytes(24).toString("hex");
  const now = Date.now();
  const session: Session = {
    token,
    userId,
    owner: true,
    createdAt: now,
    expiresAt: now + TTL_MS,
  };
  sessions.set(token, session);
  return session;
}

export function getSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return s;
}

export function revokeSession(token: string | undefined | null): boolean {
  if (!token) return false;
  return sessions.delete(token);
}

export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}
