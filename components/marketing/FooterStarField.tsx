"use client";

// Original Canvas 2D radial particle effect. No React Bits Pro code or assets.
import { useEffect, useRef } from "react";

const stars = Array.from({ length: 150 }, (_, index) => ({
  angle: index * 2.399963229728653,
  phase: ((index * 67) % 151) / 151,
  speed: 0.028 + (index % 7) * 0.004,
  size: 1.2 + (index % 5) * 0.5,
}));

export default function FooterStarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1, height = 1, elapsed = 0, previous = 0, lastPaint = 0, raf = 0, visible = false;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const radius = Math.hypot(width / 2, height) * 0.95;
      const count = width < 600 ? 80 : stars.length;
      for (let index = 0; index < count; index++) {
        const star = stars[index];
        const progress = (star.phase + elapsed * star.speed) % 1;
        const distance = 24 + progress * progress * radius;
        const angle = star.angle + Math.sin(elapsed * 0.08 + index) * 0.025;
        const x = width / 2 + Math.cos(angle) * distance;
        const y = height * 0.86 + Math.sin(angle) * distance;
        const size = star.size * (0.35 + progress);
        const fade = Math.sin(progress * Math.PI) * 0.7;
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = index % 3 === 0 ? "#7B98D7" : "#2665D7";
        context.globalAlpha = fade * (0.8 + Math.sin(elapsed * 0.7 + index) * 0.2);
        context.beginPath();
        // Filled four-point stars; no outlines, shadows or pointer interaction.
        context.moveTo(size * 2.6, 0);
        context.lineTo(size * 0.35, size * 0.35);
        context.lineTo(0, size);
        context.lineTo(-size * 0.35, size * 0.35);
        context.lineTo(-size * 2.6, 0);
        context.lineTo(-size * 0.35, -size * 0.35);
        context.lineTo(0, -size);
        context.lineTo(size * 0.35, -size * 0.35);
        context.closePath();
        context.fill();
        context.restore();
      }
    };
    const allowed = () => visible && !document.hidden && !media.matches;
    const loop = (time: number) => {
      raf = 0;
      if (!allowed()) return;
      if (previous) elapsed += Math.min(time - previous, 100) / 1000;
      previous = time;
      if (time - lastPaint >= 1000 / 30) { draw(); lastPaint = time; }
      raf = requestAnimationFrame(loop);
    };
    const refresh = () => {
      canvas.dataset.state = allowed() ? "running" : "paused";
      if (allowed()) { if (!raf) raf = requestAnimationFrame(loop); } else stop();
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const motion = () => { refresh(); };
    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); });
    ro.observe(canvas); io.observe(canvas);
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", refresh);
    resize(); motion();
    return () => {
      stop(); ro.disconnect(); io.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return <div className="gr-footer-stars" aria-hidden="true">
    <canvas ref={canvasRef} data-effect="original-star-field" />
  </div>;
}
