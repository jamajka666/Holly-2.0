export type Alert = { id: string; msg: string; ts: number };
export const Alerts = {
  list: [] as Alert[],
  push(msg: string) {
    const a = { id: crypto.randomUUID(), msg, ts: Date.now() };
    this.list.push(a);
    return a;
  }
};

