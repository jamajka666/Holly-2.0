import { broadcast } from "./sse";
import webpush from "web-push";
import { Subscription as SubModel } from "../models/Subscription";

export type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

let memSubs: PushSubscription[] = [];
Object.defineProperty(global, "SUBS_COUNT", { get() { return memSubs.length; } });

export function configurePush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env as Record<string,string|undefined>;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[web-push] VAPID keys missing – push disabled");
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:admin@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function loadSubscriptionsFromDB() {
  const rows = await SubModel.findAll();
  memSubs = rows.map(r => ({
    endpoint: r.endpoint,
    keys: { p256dh: r.p256dh, auth: r.auth },
  }));
  console.log(`[push] loaded ${memSubs.length} subscription(s) from DB`);
}

export async function addSubscription(sub: PushSubscription) {
  if (!memSubs.find(s => s.endpoint === sub.endpoint)) {
    memSubs.push(sub);
    console.log("[push] subscription added:", sub.endpoint.slice(0, 60) + "…");
  }
  await SubModel.findOrCreate({
    where: { endpoint: sub.endpoint },
    defaults: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

export async function removeSubscription(endpoint: string) {
  memSubs = memSubs.filter(s => s.endpoint !== endpoint);
  await SubModel.destroy({ where: { endpoint } });
}

export async function notifyAll(payload: object) {
  await Promise.allSettled(
    memSubs.map(s =>
      webpush.sendNotification(s as any, JSON.stringify(payload))
        .catch(async () => { await removeSubscription(s.endpoint); })
    )
  );
}
