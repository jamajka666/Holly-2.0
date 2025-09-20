import { Router } from "express";
import { sseHandler, clientsCount } from "../lib/sse";

export const sse = Router();
sse.get("/stream", (req, res) => sseHandler(req, res));
sse.get("/stream-count", (_req, res) => res.json({ clients: clientsCount() }));
export default sse;
