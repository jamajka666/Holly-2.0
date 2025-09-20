export function audit(event: string, meta: any = {}) {
  console.log("[AUDIT]", new Date().toISOString(), event, meta);
}

