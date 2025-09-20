import { Router } from "express";
import { normalizeCronOrThrow } from "../lib/cron";

export const cronGuard = Router();

/** Ošetří pouze POST/PATCH na /api/alerts (včetně /api/alerts/:id) */
cronGuard.use((req, res, next) => {
  const method = req.method.toUpperCase();
  const path = req.path;

  // Pouze pro vytvoření/úpravu alertů
  if (!["POST", "PATCH"].includes(method)) return next();
  if (!/^\/(alerts)(\/|$)/.test(path)) return next();

  try {
    const body = req.body || {};

    // Normalizace/validace cron výrazu (pokud přišel)
    if (body.cron != null) {
      body.cron = normalizeCronOrThrow(body.cron);
      // Pokud je cron, doporučujeme ignorovat 'at' (ponechám jen upozornění)
      // -> vlastní router si s tím poradí dle své logiky
    }

    // Lehké ověření 'at' (ISO) – pokud přišlo
    if (body.at != null) {
      if (typeof body.at !== "string" || !body.at.trim()) throw new Error("at musí být ISO datetime string");
      const d = new Date(body.at);
      if (isNaN(d.getTime())) throw new Error(`Neplatné 'at': ${body.at}`);
    }

    req.body = body;
    return next();
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Neplatný vstup" });
  }
});

export default cronGuard;
