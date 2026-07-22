import { Router } from "express";
import {
  classifyShellCommand,
  ownerOnlyNote,
  SHELL_ALLOWLIST,
  SHELL_READONLY,
} from "../lib/security.js";
import { desktopCapabilities } from "../tools/desktop.js";
import { listWorkspaceRoots } from "../tools/fs.js";

export const policyRouter = Router();

policyRouter.get("/policy/status", async (_req, res) => {
  const desktop = await desktopCapabilities();
  res.json({
    ownerOnly: true,
    note: ownerOnlyNote(),
    shellAllowlist: SHELL_ALLOWLIST,
    shellReadonly: [...SHELL_READONLY],
    workspaceRoots: listWorkspaceRoots(),
    tools: {
      fs: ["fs_list", "fs_read", "fs_write", "fs_search"],
      git: ["git_status", "git_diff"],
      shell: ["shell_exec"],
      desktop: ["open_url", "notify", "clipboard_get", "clipboard_set"],
    },
    desktop,
    confirmRequired: ["fs_write", "shell_exec (non-readonly)"],
    voice: {
      status: "deferred",
      speakerVerification: "planned",
      enrollment: "planned",
      foreignVoice: "hard_deny",
    },
    kali: {
      mode: "vm_ssh_profiles",
      status: "planned",
    },
    pin: {
      source: "OWNER_PIN env",
      changeableAtRuntime: false,
      note: "Change PIN via apps/server/.env OWNER_PIN and restart Core.",
    },
  });
});

policyRouter.post("/policy/check-shell", (req, res) => {
  const cmd = String(req.body?.command ?? "");
  res.json(classifyShellCommand(cmd));
});
