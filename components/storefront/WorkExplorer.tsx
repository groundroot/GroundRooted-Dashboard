'use client';
import { useId, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Play, Scissors } from 'lucide-react';
import { appCatalog } from '@/products/catalog';
import EditorialImage from './EditorialImage';
import MotionScene from './MotionScene';

const choices = [
  { label: '읽기', question: 'PDF를 편하게 읽고 싶어요', title: '모아 둔 문서에, 새로운 쓰임을.', text: '읽을 때는 전자책으로. 다시 쓸 때는 글과 그림이 연결된 자료로.', image: 'reading', icon: BookOpen },
  { label: '기록', question: '영상 내용을 글로 모으고 싶어요', title: '지나간 문장을, 나의 기록으로.', text: '영상의 자막과 출처를 함께 남기고, 내 메모와 나란히 읽으세요.', image: 'transcript', icon: Play },
  { label: '편집', question: '말 중심의 영상을 편집하고 싶어요', title: '전하고 싶은 말에서, 다음 장면으로.', text: '대본을 보며 이야기의 흐름을 고르고, Final Cut Pro 편집으로 이어가세요.', image: 'editing', icon: Scissors },
] as const;

export default function WorkExplorer({ guide = false }: { guide?: boolean }) {
  const [active, setActive] = useState(0);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className={`gr-work-explorer ${guide ? 'gr-work-guide' : 'gs-hero-visual'}`}>
    <div className="gr-work-tabs" role="tablist" aria-label={guide ? '하고 싶은 작업' : '작업 장면 선택'}>
      {choices.map((choice, index) => <button key={choice.label} type="button" role="tab"
        id={`${uid}-tab-${index}`} aria-controls={`${uid}-panel-${index}`} aria-selected={index === active}
        tabIndex={index === active ? 0 : -1} ref={node => { tabs.current[index] = node; }}
        onClick={() => setActive(index)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
          setActive(next); tabs.current[next]?.focus();
        }}>
        <choice.icon size={17} aria-hidden="true" /><span>{guide ? choice.question : choice.label}</span>
        {guide && <ArrowRight size={16} aria-hidden="true" />}
      </button>)}
    </div>
    <div className="gr-work-panels">
      {choices.map((choice, index) => <div role="tabpanel" key={choice.label} id={`${uid}-panel-${index}`}
        aria-labelledby={`${uid}-tab-${index}`} hidden={index !== active} tabIndex={0} className={`gr-work-panel gr-scene-${choice.image}`}>
        {index === active && <>
          {!guide && index === 0 ? <MotionScene priority /> : <EditorialImage name={choice.image} priority={!guide} />}
          <div className="gr-work-caption">
            <span className="gr-work-product">0{index + 1} / {appCatalog[index].name}</span>
            <h3>{choice.title}</h3>
            <p>{choice.text}</p>
            {guide && <dl><div><dt>시작할 자료</dt><dd>{appCatalog[index].input}</dd></div><div><dt>이어지는 작업</dt><dd>{appCatalog[index].output}</dd></div></dl>}
            <a href={appCatalog[index].href}>{appCatalog[index].name} {index === 2 ? '공식 사이트' : '살펴보기'}
              {index === 2 ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
            </a>
            <small>AI로 제작한 콘셉트 이미지 · 제품의 쓰임을 표현했습니다.</small>
          </div>
        </>}
      </div>)}
    </div>
  </div>;
}
