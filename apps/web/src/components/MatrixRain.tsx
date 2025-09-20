import React, { useEffect, useRef } from "react";

export default function MatrixRain({ speed = 40 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    let raf = 0;

    const chars = "01<>[]{}=#$%&*+-".split("");
    const fontSize = 14;
    let columns = Math.floor(w / fontSize);
    let drops = new Array(columns).fill(1);

    function draw() {
      // Use theme variable for rain alpha
      const rainAlpha = getComputedStyle(document.documentElement).getPropertyValue("--rain-alpha") || "0.1";
      ctx.fillStyle = `rgba(0,0,0,${rainAlpha.trim()})`;
      ctx.fillRect(0, 0, w, h);
      // Use theme accent color
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent") || "rgba(0,255,180,0.85)";
      ctx.fillStyle = accent.trim();
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      w = (canvas.width = canvas.offsetWidth);
      h = (canvas.height = canvas.offsetHeight);
      columns = Math.floor(w / fontSize);
      drops = new Array(columns).fill(1);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [speed]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
