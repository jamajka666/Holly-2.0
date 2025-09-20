import { Router } from "express";
import { scheduleOne, unschedule } from "../lib/scheduler";
import * as Models from "../models";

export const alerts = Router();

function getAlertModel(): any {
  // očekávám export Alert z ../models (po initModels v index.ts)
  const M: any = Models as any;
  return M.Alert ?? M.default?.Alert;
}

// GET /api/alerts
alerts.get("/", async (_req, res) => {
  try {
    const Alert = getAlertModel();
    const rows = await Alert.findAll({ order: [["createdAt", "DESC"]] });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "alerts.list failed" });
  }
});

// POST /api/alerts
alerts.post("/", async (req, res) => {
  try {
    const Alert = getAlertModel();
    const { title, message, cron = null, at = null, active = true } = req.body || {};
    if (!title || !message) return res.status(400).json({ error: "title a message jsou povinné" });

    const row = await Alert.create({ title, message, cron, at, active });
    // plánování (scheduler sám validuje a loguje chyby, nespadne)
    scheduleOne(row);
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "alerts.create failed" });
  }
});

// PATCH /api/alerts/:id
alerts.patch("/:id", async (req, res) => {
  try {
    const Alert = getAlertModel();
    const id = Number(req.params.id);
    const row = await Alert.findByPk(id);
    if (!row) return res.status(404).json({ error: "not found" });

    await row.update(req.body || {});
    // přenaplánování – scheduleOne interně dělá unschedule(id)
    scheduleOne(row);
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "alerts.update failed" });
  }
});

// DELETE /api/alerts/:id
alerts.delete("/:id", async (req, res) => {
  try {
    const Alert = getAlertModel();
    const id = Number(req.params.id);
    const row = await Alert.findByPk(id);
    if (!row) return res.status(404).json({ error: "not found" });

    unschedule(id);
    await row.destroy();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "alerts.delete failed" });
  }
});

export default alerts;
