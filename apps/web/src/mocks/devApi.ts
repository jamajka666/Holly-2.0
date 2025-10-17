type Row = { id:string; name:string; kind:string; state:"online"|"offline"; paired?:boolean };
const DEVICES: Row[] = [
  { id:"bv5300", name:"BV5300 Pro", kind:"Android", state:"online", paired:true },
  { id:"asus-rog", name:"Asus ROG", kind:"Linux", state:"online", paired:true },
  { id:"rpi-01", name:"Raspberry Pi", kind:"Edge", state:"offline", paired:false },
];

export function bootDevApiMocks(){
  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    // list
    if (url.endsWith("/api/devices") && (!init || (init.method||"GET")==="GET")) {
      return new Response(JSON.stringify(DEVICES), { status:200, headers:{"Content-Type":"application/json"} });
    }
    // ping
    if (/\/api\/devices\/[^/]+\/ping$/.test(url) && (init?.method==="POST")) {
      return new Response(JSON.stringify({ ok:true }), { status:200 });
    }
    // reboot
    if (/\/api\/devices\/[^/]+\/reboot$/.test(url) && (init?.method==="POST")) {
      return new Response(JSON.stringify({ ok:true }), { status:200 });
    }
    // pair/unpair
    if (/\/api\/devices\/([^/]+)\/(pair|unpair)$/.test(url) && (init?.method==="POST")) {
      const m = url.match(/\/api\/devices\/([^/]+)\/(pair|unpair)$/);
      if (m) {
        const [, id, act] = m;
        const idx = DEVICES.findIndex(d=>d.id===id);
        if (idx>=0) DEVICES[idx].paired = act==="pair";
      }
      return new Response(JSON.stringify({ ok:true }), { status:200 });
    }
    // vault
    if (url.endsWith("/api/vault/unlock") && init?.method==="POST") {
      return new Response(JSON.stringify({ ok:true }), { status:200 });
    }
    if (url.endsWith("/api/vault/lock") && init?.method==="POST") {
      return new Response(JSON.stringify({ ok:true }), { status:200 });
    }
    return origFetch(input, init);
  };
  console.warn("[DEV] Using mock API endpoints");
}
