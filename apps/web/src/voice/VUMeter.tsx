import { useEffect, useRef } from "react";

export default function VUMeter({active}:{active:boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let anim = 0;
    let ctx:AudioContext|undefined;
    let src:MediaStreamAudioSourceNode|undefined;
    let analyser:AnalyserNode|undefined;
    let data:Uint8Array|undefined;
    async function boot(){
      if(!active) return;
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      data = new Uint8Array(analyser.frequencyBinCount);
      const el = ref.current!;
      const loop = ()=>{
        if(!analyser || !data) return;
        (analyser as any).getByteTimeDomainData(data);
        let sum=0;
        for (let i=0;i<data.length;i++){ const v=(data[i]-128)/128; sum+=v*v; }
        const rms = Math.sqrt(sum/data.length); // 0..1 approx
        el.style.setProperty("--vu", String(Math.min(1, rms*4)));
        anim = requestAnimationFrame(loop);
      };
      loop();
    }
    boot();
    return ()=> { cancelAnimationFrame(anim); try{ (ctx as any)?.close?.(); }catch{} };
  },[active]);
  return (
    <div
      ref={ref}
      aria-hidden
      className="h-2 w-28 rounded-full bg-slate-800/60 overflow-hidden border border-slate-700/60"
      style={{
        position:"relative",
        boxShadow:"inset 0 0 6px #00e5ff44",
        backgroundImage:"linear-gradient(to right, #00e5ff33, transparent)",
      }}
    >
      <div
        style={{
          width:"calc(var(--vu,0) * 100%)",
          height:"100%",
          transition:"width 80ms linear",
          background:"linear-gradient(to right, #39ff14aa, #00e5ffaa)",
        }}
      />
    </div>
  );
}
