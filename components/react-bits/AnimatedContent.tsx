"use client";
// Adapted from React Bits AnimatedContent, commit 2ec034e. See LICENSE.md / PROVENANCE.md.
import { useEffect, useRef, type ReactNode } from "react";

export default function AnimatedContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let clean = () => {};
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
      const { gsap } = await import("gsap");
      if (cancelled) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // SSR and animation both preserve text visibility.
        gsap.fromTo(el, { y: 8 }, { y: 0, duration: 0.24, ease: "power3.out", clearProps: "transform" });
      });
      clean = () => mm.revert();
      } catch { /* Static server-rendered content remains visible if the chunk fails. */ }
    }, { threshold: 0.12 });
    observer.observe(el);
    return () => { cancelled = true; observer.disconnect(); clean(); };
  }, []);
  return <div ref={ref} className={className} data-react-bits="AnimatedContent">{children}</div>;
}
