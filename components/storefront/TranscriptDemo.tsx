'use client';
import { useId, useRef, useState } from 'react';
import { Check, Copy, FileText, List } from 'lucide-react';

const transcript = [
  ['00:00', '좋은 자료는 한 번 읽고 끝나지 않습니다.'],
  ['00:08', '마음에 남은 문장에 나의 질문을 더해 보세요.'],
  ['00:16', '다시 꺼내 읽을 때, 다음 생각이 시작됩니다.'],
];
const markdown =
  '# 기록에서 시작하는 다음 생각\n\n- 채널: GroundRooted 설명용 채널\n- 원본: 실제 영상 주소가 들어가는 자리\n\n## 자막\n\n' +
  transcript.map(([, text]) => text).join('\n\n') +
  '\n\n*직접 작성한 설명용 예시입니다. 실제 수집 결과가 아닙니다.*\n';

export default function TranscriptDemo() {
  const uid = useId();
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus('Markdown 예시를 복사했습니다.');
    } catch {
      setStatus('복사 권한이 없습니다. 아래 Markdown을 직접 선택해 복사해 주세요.');
    }
  }
  return (
    <div className="gs-transcript-demo">
      <div className="gs-demo-toolbar">
        <div role="tablist" aria-label="자막 저장 예시">
          {['자막 원문', 'Markdown 파일'].map((label, i) => (
            <button
              key={label}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${uid}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-controls={`${uid}-panel-${i}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => {
                setActive(i);
                setStatus('');
              }}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - active;
                setActive(next);
                setStatus('');
                tabs.current[next]?.focus();
              }}
            >
              {i === 0 ? (
                <List size={16} aria-hidden="true" />
              ) : (
                <FileText size={16} aria-hidden="true" />
              )}
              {label}
            </button>
          ))}
        </div>
        <span>직접 작성한 설명용 예시</span>
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel-0`}
        aria-labelledby={`${uid}-tab-0`}
        hidden={active !== 0}
        tabIndex={0}
        className="gs-transcript-panel"
      >
        <p className="gs-demo-document-title">기록에서 시작하는 다음 생각</p>
        <p className="gs-demo-document-meta">설명용 채널 · 예시 자막</p>
        <ol>
          {transcript.map(([time, text]) => (
            <li key={time}>
              <span>{time}</span>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel-1`}
        aria-labelledby={`${uid}-tab-1`}
        hidden={active !== 1}
        tabIndex={0}
        className="gs-transcript-panel"
      >
        <div className="gs-demo-filebar">
          <span>나의 영상 기록.md</span>
          <button type="button" onClick={copy}>
            {status.startsWith('Markdown') ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            예시 복사
          </button>
        </div>
        <pre>{markdown}</pre>
      </div>
      <p className="gs-demo-status" role="status">
        {status || '영상의 말을 임의로 요약하지 않고, 원문과 출처를 함께 보관하는 흐름입니다.'}
      </p>
    </div>
  );
}
