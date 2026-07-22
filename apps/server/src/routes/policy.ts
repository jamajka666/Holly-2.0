import { Router } from "express";
import { classifyShellCommand, ownerOnlyNote, SHELL_ALLOWLIST } from "../lib/security.js";

export const policyRouter = Router();

policyRouter.get("/policy/status", (_req, res) => {
  res.json({
    ownerOnly: true,
    note: ownerOnlyNote(),
    shellAllowlist: SHELL_ALLOWLIST,
    voice: {
      speakerVerification: "planned",
      enrollment: "planned",
      foreignVoice: "hard_deny",
    },
    kali: {
      mode: "vm_ssh_profiles",
      status: "planned",
    },
  });
});

policyRouter.post("/policy/check-shell", (req, res) => {
  const cmd = String(req.body?.command ?? "");
  res.json(classifyShellCommand(cmd));
});
