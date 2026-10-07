"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
const Lightfall = dynamic(() => import("@/components/react-bits/Lightfall"), { ssr: false });
export default function HeroBackground() {
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(true);
  const [activated, setActivated] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = matchMedia("(max-width: 767px)");
    const update = () => setReduced(media.matches);
    const resize = () => setCompact(viewport.matches);
    update(); media.addEventListener("change", update);
    resize(); viewport.addEventListener("change", resize);
    const timer = window.setTimeout(() => setReady(true), 400);
    return () => { clearTimeout(timer); media.removeEventListener("change", update); viewport.removeEventListener("change", resize); };
  }, []);
  const started = !compact || activated;
  const stopped = !started || paused;
  return <>
    <div className="gr-lightfall-layer">{ready && !reduced && started ? <Lightfall paused={paused} /> : null}</div>
    {ready && !reduced ? <button className="gr-motion-control" type="button" aria-pressed={stopped} onClick={() => { if (!started) { setActivated(true); setPaused(false); } else setPaused(!paused); }}>{stopped ? <Play size={13} /> : <Pause size={13} />}<span>배경 {stopped ? "재생" : "정지"}</span></button> : null}
  </>;
}
