import { sse } from "./routes/sse";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { initModels } from "./models";
import { alerts } from "./routes/alerts";
import { subscriptions } from "./routes/subscriptions";
import { configurePush } from "./lib/push";
import { rescheduleAll } from "./lib/scheduler";
import { notifyAll, loadSubscriptionsFromDB } from "./lib/push"; // <- pro test-push

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/alerts", alerts);
app.use("/api/subscriptions", subscriptions);
app.use("/api/alerts", sse);

app.get("/health", (_req, res) => res.json({ ok: true }));

// okamžité odeslání testovací notifikace
app.post("/api/alerts/test-push", async (req, res) => {
  const { title = "Test", message = "Hello from server" } = req.body || {};
  await notifyAll({ type: "alert", title, message });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;

(async () => {
  await initModels();
  configurePush();
  await loadSubscriptionsFromDB();
  await rescheduleAll();

  app.listen(PORT, () => console.log(`[M3.7] Alerts API běží na http://localhost:${PORT}`));
})();
