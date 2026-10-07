'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { paperMotionPath } from '@/products/editorial-media';
import EditorialImage from './EditorialImage';

// Opt-in only: no video request or automatic motion on initial render, including
// reduced-motion/save-data devices. Leaving the viewport never resumes playback.
export default function MotionScene({ priority = false }: { priority?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const request = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    const player = video.current;
    function stop() {
      request.current++;
      player?.pause();
      setPlaying(false);
      setLoading(false);
    }
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); });
    if (container.current) observer.observe(container.current);
    const visibility = () => { if (document.hidden) stop(); };
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    preference.addEventListener('change', stop);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      request.current++;
      player?.pause();
      observer.disconnect();
      preference.removeEventListener('change', stop);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  async function toggle() {
    const player = video.current;
    if (!player) return;
    const token = ++request.current;
    if (playing || loading) {
      player.pause(); setPlaying(false); setLoading(false); return;
    }
    setError(false); setLoading(true);
    if (!player.getAttribute('src') || player.error) { player.src = paperMotionPath; player.load(); }
    try {
      await player.play();
      if (token !== request.current) { player.pause(); return; }
      setPlaying(true); setHasFrame(true); setLoading(false);
    } catch {
      if (token !== request.current) return;
      setError(true); setHasFrame(false); setPlaying(false); setLoading(false);
    }
  }
  return <div className="gr-motion-scene" ref={container}>
    <EditorialImage name="reading" priority={priority} />
    <video ref={video} className={hasFrame ? 'gr-motion-visible' : ''} muted playsInline loop preload="none" aria-hidden="true"
      onError={() => { request.current++; setError(true); setHasFrame(false); setPlaying(false); setLoading(false); }} />
    <button type="button" className="gr-scene-control" onClick={toggle} aria-pressed={playing || loading}>
      {playing || loading ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      {loading ? '불러오기 취소' : playing ? '장면 정지' : error ? '다시 재생' : '장면 재생'}
    </button>
    <span className="gr-motion-status" role="status">{error ? '영상을 불러오지 못해 이미지로 보여드립니다.' : loading ? '장면을 불러오고 있습니다.' : ''}</span>
  </div>;
}
