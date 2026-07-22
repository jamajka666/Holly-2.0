import { Router } from "express";
import {
  classifyShellCommand,
  ownerOnlyNote,
  SHELL_ALLOWLIST,
  SHELL_READONLY,
} from "../lib/security.js";
import { desktopCapabilities } from "../tools/desktop.js";
import { listWorkspaceRoots } from "../tools/fs.js";
import { kaliConfigured, loadKaliConfig } from "../kali/config.js";
import { listProfiles } from "../kali/profiles.js";

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
      kali: ["kali_status", "kali_run"],
    },
    desktop,
    confirmRequired: [
      "fs_write",
      "shell_exec (non-readonly)",
      "kali_run (except sysinfo/whoami)",
    ],
    voice: {
      status: "deferred",
      speakerVerification: "planned",
      enrollment: "planned",
      foreignVoice: "hard_deny",
    },
    kali: {
      mode: "vm_ssh_profiles",
      status: kaliConfigured() ? "configured" : "not_configured",
      freeShell: false,
      host: loadKaliConfig().host || null,
      profiles: listProfiles().map((p) => p.id),
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
