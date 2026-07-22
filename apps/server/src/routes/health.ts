import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "@holly/server",
    time: new Date().toISOString(),
    version: "0.2.0",
  });
});
