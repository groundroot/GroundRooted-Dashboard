'use client';
import { useState, useId } from 'react';
import { ArrowRight } from 'lucide-react';
import MotionScene from './MotionScene';

export default function ReadingStory() {
  const [reuse, setReuse] = useState(false);
  const uid = useId();
  return <div className="gr-reading-story">
    <figure><MotionScene /><figcaption>자료가 지식으로 이어지는 모습을 표현한 AI 콘셉트 영상</figcaption></figure>
    <div className="gr-reading-story-copy">
      <p className="gr-story-kicker">한 장의 PDF, 두 가지 쓰임</p>
      <div className="gr-stage-buttons" role="group" aria-label="자료를 활용하는 방식">
        <button type="button" aria-pressed={!reuse} aria-controls={uid} onClick={() => setReuse(false)}>내가 읽을 때</button>
        <button type="button" aria-pressed={reuse} aria-controls={uid} onClick={() => setReuse(true)}>다시 활용할 때</button>
      </div>
      <div id={uid} aria-live="polite" aria-atomic="true" className="gr-reading-story-result">
        <h3>{reuse ? <>생각을 더할 수 있는,<br />나만의 자료로.</> : <>눈에 편한 크기로,<br />읽는 흐름에 맞게.</>}</h3>
        <p>{reuse ? 'Markdown 본문과 연결된 이미지를 내 서재에 모으고, 메모를 더해 다음 작업으로 이어가세요.' : 'EPUB을 지원하는 뷰어에서 글자 크기와 읽기 설정을 조절하며, 읽고 싶었던 내용에 집중하세요.'}</p>
      </div>
      <a href="#experience">같은 문서로 체험하기 <ArrowRight size={16} aria-hidden="true" /></a>
    </div>
  </div>;
}
