"use client";

import { useState } from "react";
import { BookOpen, Minus, Plus, RotateCcw } from "lucide-react";

/** A working browser reflow sample, not an app screenshot or real conversion. */
export default function HeroReader() {
  const [size, setSize] = useState(20);
  return <div className="gr-hero-reader">
    <div className="gr-hero-reader-label"><BookOpen size={19} /><span>EPUB 읽기 체험</span><span>설명용 예시</span></div>
    <article className="gr-hero-reader-page" style={{ fontSize: size }} tabIndex={0} aria-label="첫 화면 EPUB 읽기 예시">
      <h2>좋은 자료를,<br />나에게 맞는 크기로.</h2>
      <p>작은 글씨에 눈을 맞추지 않아도 괜찮습니다. 글자를 키우면 문장은 화면 너비에 맞춰 다시 흐릅니다.</p>
      <p>읽고 싶었던 보고서도, 오래 보관한 자료도. 편안하게 읽고 다음 생각으로 이어 가세요.</p>
    </article>
    <div className="gr-hero-reader-controls">
      <span>글자 크기</span>
      <button type="button" aria-label="첫 화면 글자 줄이기" disabled={size === 16} onClick={() => setSize(value => Math.max(16, value - 2))}><Minus size={18} /></button>
      <output aria-live="polite" aria-label="첫 화면 글자 크기">{size}px</output>
      <button type="button" aria-label="첫 화면 글자 키우기" disabled={size === 28} onClick={() => setSize(value => Math.min(28, value + 2))}><Plus size={18} /></button>
      <button type="button" aria-label="첫 화면 글자 크기 초기화" disabled={size === 20} onClick={() => setSize(20)}><RotateCcw size={17} /></button>
    </div>
    <p className="gr-hero-reader-note">브라우저 리플로우 예시입니다. 실제 EPUB 파일은 아닙니다.</p>
  </div>;
}
