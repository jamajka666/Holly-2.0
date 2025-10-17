export type SSEOptions = {
  headers?: Record<string,string>;
  onOpen?: (ev: Event)=>void;
  onError?: (ev: Event)=>void;
  onMessage?: (ev: MessageEvent)=>void;
  retryBaseMs?: number;
  maxRetryMs?: number;
};

export function connectSSE(url: string, opts: SSEOptions) {
  let es: EventSource | null = null;
  let stopped = false;
  let retry = opts.retryBaseMs ?? 1000;
  const max = opts.maxRetryMs ?? 15000;

  const start = () => {
    if (stopped) return;
    es = new EventSource(url);
    es.onopen = (e)=>{ retry = opts.retryBaseMs ?? 1000; opts.onOpen?.(e); };
    es.onerror = (e)=>{
      opts.onError?.(e);
      es?.close(); es = null;
      if (stopped) return;
      setTimeout(start, retry);
      retry = Math.min(max, Math.round(retry * 1.7));
    };
    es.onmessage = (e)=> opts.onMessage?.(e as MessageEvent);
  };
  start();

  return {
    close(){ stopped = true; es?.close(); es = null; }
  };
}
