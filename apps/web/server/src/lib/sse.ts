import type { Request, Response } from "express";

type Client = { id: number; res: Response };
const clients = new Map<number, Client>();
let nextId = 1;

export function sseHandler(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();
  res.write(`event: hello\ndata: {"ok":true}\n\n`);

  const id = nextId++;
  const client: Client = { id, res };
  clients.set(id, client);

  const iv = setInterval(() => {
    try { res.write(`event: ping\ndata: "🫶"\n\n`); } catch {}
  }, 25000);

  req.on("close", () => { clearInterval(iv); clients.delete(id); });
}

export function broadcast(payload: unknown) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const { res } of clients.values()) { try { res.write(data); } catch {} }
}

export function clientsCount() { return clients.size; }
