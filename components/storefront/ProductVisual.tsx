'use client';
import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import EditorialImage from './EditorialImage';

const scenes = {
  readymd: { image: 'reading', source: '다시 읽으려고 모아 둔 PDF', result: '눈에 맞춰 읽고, 다음 작업에 꺼내 쓰세요.', files: ['읽기용 EPUB', 'Markdown', '연결된 이미지'] },
  'youtube-to-md': { image: 'transcript', source: '자막이 제공되는 강의와 인터뷰', result: '원문과 출처를 나란히 보관하세요.', files: ['영상 제목·채널', '원본 주소', '자막 원문'] },
  'typecut-pro': { image: 'editing', source: '말을 중심으로 구성한 영상과 대본', result: '문장에서 고른 흐름을 편집으로 이어가세요.', files: ['대본', '자막', 'Final Cut Pro 편집'] },
} as const;
export default function ProductVisual({ product, hero = false }: { product: keyof typeof scenes; hero?: boolean }) {
  const scene = scenes[product];
  const [result, setResult] = useState(false);
  const uid = useId();
  return <figure className={`gr-product-art gr-scene-${scene.image}`}>
    <EditorialImage name={scene.image} priority={hero} />
    <div className="gr-product-art-content">
      <div className="gr-stage-buttons" role="group" aria-label="자료의 쓰임 살펴보기">
        <button type="button" aria-pressed={!result} aria-controls={uid} onClick={() => setResult(false)}>01 모은 자료</button>
        <ArrowRight size={15} aria-hidden="true" />
        <button type="button" aria-pressed={result} aria-controls={uid} onClick={() => setResult(true)}>02 다음 쓰임</button>
      </div>
      <div className="gr-stage-result" id={uid} aria-live="polite" aria-atomic="true">
        <p>{result ? scene.result : scene.source}</p>
        <span>{result ? scene.files.join(' · ') : '위의 단계를 선택해 이어지는 작업을 살펴보세요.'}</span>
      </div>
      <figcaption>AI로 제작한 콘셉트 이미지 · 실제 앱 화면이 아닙니다.</figcaption>
    </div>
  </figure>;
}
