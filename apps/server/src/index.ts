import "dotenv/config";
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { alertsRouter } from "./routes/alerts.js";
import { authRouter } from "./routes/auth.js";
import { auditRouter } from "./routes/audit.js";
import { policyRouter } from "./routes/policy.js";
import { agentRouter } from "./routes/agent.js";
import { desktopRouter } from "./routes/desktop.js";
import { addAudit } from "./lib/audit.js";
import { generateAlert } from "./lib/alerts.js";
import { listWorkspaceRoots } from "./tools/fs.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "127.0.0.1";
const allowLan = process.env.ALLOW_LAN === "true";

// Default workspace to monorepo root if not set
if (!process.env.WORKSPACE_ROOTS) {
  process.env.WORKSPACE_ROOTS = process.env.HOME
    ? `${process.env.HOME}/Holly-2.0`
    : process.cwd();
}

app.use(
  cors({
    origin: allowLan ? true : [/localhost/, /127\.0\.0\.1/],
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);
app.use(alertsRouter);
app.use(authRouter);
app.use(auditRouter);
app.use(policyRouter);
app.use(agentRouter);
app.use(desktopRouter);

// Seed a few alerts so Dashboard is not empty on first paint
for (let i = 0; i < 3; i++) generateAlert();

const listenHost = allowLan ? "0.0.0.0" : host;

app.listen(port, listenHost, () => {
  addAudit("SERVER_START", "system", { host: listenHost, port });
  console.log(`[holly] @holly/server listening on http://${listenHost}:${port}`);
  console.log(`[holly] owner-only policy active; bind=${listenHost}`);
  console.log(`[holly] workspace roots: ${listWorkspaceRoots().join(", ")}`);
});
