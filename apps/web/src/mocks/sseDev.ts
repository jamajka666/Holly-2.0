export function bootDevSSEPolyfill(){
  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  const orig = window.EventSource;
  try {
    // otestuj skutečné připojení — pokud selže do 1s, polyfill
    const test = new orig("/api/alerts/stream");
    const timer = setTimeout(()=>{ try { test.close(); } catch {} ; polyfill(); }, 1000);
    test.onopen = ()=>{ clearTimeout(timer); test.close(); };
    test.onerror = ()=>{ clearTimeout(timer); polyfill(); };
  } catch { polyfill(); }

  function polyfill(){
    // lehký fake stream (nenahrazuje EventSource obecně, jen URL)
    (window as any).EventSource = class {
      onopen: any; onerror:any; onmessage:any; _timer:any;
      constructor(public url:string){
        this._timer = setInterval(()=>{
          const levels = ["info","warning","error"];
          const lvl = levels[Math.floor(Math.random()*levels.length)];
          const payload = { id: crypto.randomUUID(), level: lvl, message: `DEV ${lvl} alert`, ts: Date.now() };
          this.onmessage?.({ data: JSON.stringify(payload) });
        }, 4000);
        setTimeout(()=> this.onopen?.(new Event("open")), 10);
      }
      close(){ clearInterval(this._timer); }
      addEventListener(){ /* n/a */ }
      removeEventListener(){ /* n/a */ }
    }
    console.warn("[DEV] Using mock SSE stream");
  }
}
