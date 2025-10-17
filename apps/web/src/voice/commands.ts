export type Intent =
  | { type: "open"; target: "settings" | "devices" | "dashboard" }
  | { type: "notifications"; action: "clear" | "read" }
  | { type: "device"; action: "ping"; target?: string }
  | { type: "vault"; action: "unlock" | "lock"; pin?: string }
  | { type: "dnd"; on: boolean }
  | { type: "theme"; profile: "holly" | "shadowguard" }
  | { type: "status" }
  | { type: "help" }
  | { type: "unknown"; text: string };

export function parseIntent(text: string): Intent {
  const t = text.trim().toLowerCase();

  if (/status|stav|jak.*jsi/.test(t)) return { type: "status" };

  if (/dnd|do ?not ?disturb|neruš|nerus/.test(t)) {
    const on = /\b(on|zap|enable|zapni)\b/.test(t) || /dnd\b(?!.*off)/.test(t);
    const off = /\b(off|vyp|disable|vypni)\b/.test(t);
    return { type: "dnd", on: on && !off ? true : off ? false : true };
  }

  if (/theme|profil|appearance|vzhled/.test(t)) {
    if (/shadow|shadowguard/.test(t)) return { type: "theme", profile: "shadowguard" };
    return { type: "theme", profile: "holly" };
  }

  if (/(vault|trezor)/.test(t)) {
    if (/unlock|odem(kni|cit)/.test(t)) {
      const m = t.match(/pin\s*(\d{4,8})/);
      return { type: "vault", action: "unlock", pin: m?.[1] };
    }
    if (/lock|zam(kni|knout)/.test(t)) return { type: "vault", action: "lock" };
  }

  if (/\bping\b/.test(t) && /(device|zařízení|zarizeni)/.test(t)) {
    const m = t.match(/ping (?:device|zařízení|zarizeni)\s+(.+)/);
    return { type: "device", action: "ping", target: m?.[1]?.trim() };
  }

  if (/open|otev(ři|rit)/.test(t)) {
    if (/(settings|nastaven)/.test(t)) return { type: "open", target: "settings" };
    if (/(devices|zařízení|zarizeni)/.test(t)) return { type: "open", target: "devices" };
    return { type: "open", target: "dashboard" };
  }

  if (/(notifications?|alerty|upozornění)/.test(t)) {
    if (/(clear|vyčis|smaz)/.test(t)) return { type: "notifications", action: "clear" };
    return { type: "notifications", action: "read" };
  }

  if (/help|nápověda|what can you do/.test(t)) return { type: "help" };
  return { type: "unknown", text };
}

