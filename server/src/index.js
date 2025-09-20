import "dotenv/config";
import express from "express";
import cors from "cors";
import auditRouter from "./routes/audit.js";
import authRouter from "./routes/auth.js";
import { loadAIConfig, isClaudeSonnet4EnabledForAllClients, isO4MiniEnabledForAllClients, getConfigStatus } from "./ai-config.js";

const app = express();
app.use(cors({ origin: true }));

// Initialize AI configuration
const aiConfig = loadAIConfig();
console.log("🤖 AI Configuration loaded:");
console.log("📋 Claude Sonnet 4 status:", getConfigStatus());

app.get("/health", (req, res) => res.json({ ok:true }));

// AI Configuration endpoints
app.get("/api/ai/config", (req, res) => {
  const status = getConfigStatus();
  res.json({
    o4mini: {
      enabled: status.o4MiniEnabled,
      enabledForAllClients: status.o4MiniEnabledForAllClients,
      status: status.o4MiniEnabledForAllClients ? "✅ ENABLED FOR ALL CLIENTS" : "❌ DISABLED"
    },
    claudeSonnet4: {
      enabled: status.claudeSonnet4Enabled,
      enabledForAllClients: status.claudeSonnet4EnabledForAllClients,
      status: status.claudeSonnet4EnabledForAllClients ? "✅ ENABLED FOR ALL CLIENTS" : "❌ DISABLED"
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/ai/o4-mini/status", (req, res) => {
  const enabled = isO4MiniEnabledForAllClients();
  res.json({
    enabledForAllClients: enabled,
    message: enabled ? "o4-mini is enabled for all clients" : "o4-mini is not enabled for all clients",
    status: enabled ? "ENABLED" : "DISABLED"
  });
});

app.get("/api/ai/claude-sonnet-4/status", (req, res) => {
  const enabled = isClaudeSonnet4EnabledForAllClients();
  res.json({
    enabledForAllClients: enabled,
    message: enabled ? "Claude Sonnet 4 is enabled for all clients" : "Claude Sonnet 4 is not enabled for all clients",
    status: enabled ? "ENABLED" : "DISABLED"
  });
});

app.use(auditRouter);
app.use(authRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 API listening on http://127.0.0.1:${port}`);
  console.log("🤖 o4-mini Status:", isO4MiniEnabledForAllClients() ? "✅ ENABLED FOR ALL CLIENTS" : "❌ DISABLED");
  console.log("🤖 Claude Sonnet 4 Status:", isClaudeSonnet4EnabledForAllClients() ? "✅ ENABLED FOR ALL CLIENTS" : "❌ DISABLED");
  console.log("📡 Check statuses at: http://127.0.0.1:" + port + "/api/ai/o4-mini/status and /api/ai/claude-sonnet-4/status");
});
