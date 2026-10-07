"use client";
// Adapted from React Bits SplitText, commit 2ec034e. See LICENSE.md / PROVENANCE.md.
import { useEffect, useRef } from "react";

export default function SplitText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let clean = () => {};
    Promise.all([import("gsap"), import("gsap/SplitText"), document.fonts.ready]).then(([{ gsap }, { SplitText: GSAPSplitText }]) => {
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(GSAPSplitText);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = new GSAPSplitText(ref.current!, { type: "words", smartWrap: true, reduceWhiteSpace: false, aria: "none" });
        const tween = gsap.fromTo(split.words, { y: 6, opacity: 1 }, { y: 0, duration: 0.24, stagger: 0.03, ease: "power3.out" });
        return () => { tween.kill(); split.revert(); };
      });
      clean = () => mm.revert();
    }).catch(() => { /* Original text remains visible. */ });
    return () => { cancelled = true; clean(); };
  }, [text]);
  return <span ref={ref} className={className} data-react-bits="SplitText">{text}</span>;
}
