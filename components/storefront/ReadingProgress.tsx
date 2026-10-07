'use client';
import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const length = document.documentElement.scrollHeight - innerHeight;
      setProgress(length > 0 ? Math.min(100, Math.max(0, Math.round(scrollY / length * 100))) : 0);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, []);
  return <progress className="gr-reading-progress" max={100} value={progress} aria-label="페이지 읽은 위치" />;
}
