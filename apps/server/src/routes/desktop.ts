import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  clipboardGet,
  clipboardSet,
  desktopCapabilities,
  desktopNotify,
  openUrl,
} from "../tools/desktop.js";

export const desktopRouter = Router();

desktopRouter.get("/desktop/capabilities", requireSession, async (_req, res) => {
  res.json({ ok: true, ...(await desktopCapabilities()) });
});

desktopRouter.post("/desktop/open-url", requireSession, async (req, res) => {
  const url = String(req.body?.url ?? "");
  res.json(await openUrl(url));
});

desktopRouter.post("/desktop/notify", requireSession, async (req, res) => {
  const title = String(req.body?.title ?? "Holly");
  const body = String(req.body?.body ?? "");
  res.json(await desktopNotify(title, body));
});

desktopRouter.get("/desktop/clipboard", requireSession, async (_req, res) => {
  res.json(await clipboardGet());
});

desktopRouter.post("/desktop/clipboard", requireSession, async (req, res) => {
  const schema = z.object({ text: z.string().max(32_000) });
  try {
    const { text } = schema.parse(req.body);
    res.json(await clipboardSet(text));
  } catch {
    res.status(400).json({ ok: false, error: "bad_request" });
  }
});
