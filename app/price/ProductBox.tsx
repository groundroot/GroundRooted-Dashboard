import type { PlanId, Tier } from '@/products/videokit';

// 상품 페이지(/videokit)의 상품 박스와 같은 모양. 결제 화면에서 무엇을 사는지 보여 준다.
export default function ProductBox({ plan, tier }: { plan: PlanId; tier: Tier }) {
  if (plan === 'pass') return <section className="vk-prod" aria-label="구매 상품">
    <div className="vt-stage" aria-hidden="true"><div className="vt">
      <div className="vt-main">
        <p className="vb-brand"><i />GroundRooted</p>
        <p className="vt-kind">1:1 LESSON PASS</p>
        <p className="vt-title">1:1 강의권<small>클로드 비디오 키트 구매자용</small></p>
        <p className="vt-meta">2회 · 총 2시간</p>
      </div>
      <div className="vt-stub"><b>×2</b><span>SESSIONS</span></div>
    </div></div>
    <div className="vk-prod-copy">
      <p className="for lec">이미 키트를 구입하셨다면</p>
      <h2>1:1 강의권 2회</h2>
      <p className="meta">키트를 먼저 구입한 뒤 강의가 필요해졌을 때 신청합니다. 키트 파일은 들어 있지 않습니다. 일정은 개별 조율합니다.</p>
      <ul className="inc"><li>1:1 강의 2회 · 총 2시간</li><li>클로드 코드 사용법</li><li>키트 설치 원격 지원</li></ul>
    </div>
  </section>;
  const lec = plan === 'lesson';
  const sessions = tier === 's' ? '1:1 강의 2회 · 총 2시간' : '1:1 강의 3회 · 3주';
  return <section className="vk-prod" aria-label="구매 상품">
    <div className={lec ? 'vb-stage has-lesson' : 'vb-stage'} aria-hidden="true"><div className={lec ? 'vb vb-lec' : 'vb'}>
      <div className="vb-f vb-front">
        <p className="vb-brand"><i />GroundRooted</p>
        <div className="vb-marks"><span><img src="/videokit/logos/claude.svg" alt="" width={26} height={26} /></span><em />
          <span className="vb-eds"><img src="/videokit/logos/final-cut-pro.png" alt="" width={22} height={22} /><img src="/videokit/logos/capcut.svg" alt="" width={22} height={22} /><img src="/videokit/logos/davinci-resolve.svg" alt="" width={22} height={22} /><img className="soon" src="/videokit/logos/premiere-pro.svg" alt="" width={22} height={22} /><img className="soon" src="/videokit/logos/filmcraft.png" alt="" width={22} height={22} /></span></div>
        <p className="vb-title">클로드<br />비디오 키트</p>
        {lec && <p className="vb-tags"><span>+ 1:1 강의</span><span>원격 설치</span></p>}
        <div className="vb-lanes"><i /><i /><i /></div>
        <p className="vb-ed"><span>{lec ? 'VIDEO KIT + 1:1' : 'VIDEO KIT'}</span><b>macOS · Windows</b></p>
      </div>
      <div className="vb-f vb-side"><p><i />{lec ? '키트 + 1:1 강의' : '클로드 비디오 키트'}</p></div>
      <div className="vb-f vb-top" />
      {lec && <div className="vb-seal"><svg viewBox="0 0 120 120">
        <defs><path id="vb-ring-pay" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
        <circle cx="60" cy="60" r="58" fill="#ff6b3d" />
        <circle cx="60" cy="60" r="51" fill="none" stroke="#131316" strokeOpacity=".35" strokeWidth="1.2" />
        <circle cx="60" cy="60" r="33" fill="#131316" />
        <text fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="8" fontWeight="700" fill="#131316"><textPath href="#vb-ring-pay" textLength="272" lengthAdjust="spacing">365 DAYS · 1:1 CHAT · 365 DAYS · 1:1 CHAT · </textPath></text>
        <text x="60" y="63" textAnchor="middle" fontFamily="Pretendard Variable, Pretendard, sans-serif" fontSize="25" fontWeight="800" letterSpacing="-1" fill="#ff6b3d">365</text>
        <text x="60" y="78" textAnchor="middle" fontFamily="Pretendard Variable, Pretendard, sans-serif" fontSize="9.5" fontWeight="700" fill="#ecebe6">1:1 채팅지원</text>
      </svg></div>}
    </div>
    {lec && <div className="vl"><div className="vl-scr"><div className="vl-in">
      <p className="vl-bar"><i />1:1 강의<span>REMOTE</span></p>
      <div className="vl-chat"><i /><i /></div>
      <div className="vl-lanes"><i /><i /><i /><b /></div>
      <svg className="vl-cur" viewBox="0 0 16 16"><path d="M2 1.5 13.5 8 8.4 9.2 5.8 14z" fill="#fff" stroke="#131316" strokeWidth="1.2" strokeLinejoin="round" /></svg>
    </div></div><div className="vl-neck" /><div className="vl-base" /></div>}
    </div>
    <div className="vk-prod-copy">
      <p className={lec ? 'for lec' : 'for'}>{lec ? '클로드 코드가 처음이라면' : '클로드 코드에 익숙한 분께 권장'}</p>
      <h2>{lec ? '키트 + 1:1 강의' : '키트'}</h2>
      <p className="meta">{lec
        ? '클로드 코드 사용법부터 배우고, 키트 설치는 원격으로 함께 진행합니다. 일정은 개별 조율합니다.'
        : '키트 파일과 사용 설명 eBook을 받아 직접 설치하고 세팅합니다. 강의는 들어 있지 않으며, 필요하면 1:1 강의권을 따로 구입합니다.'}</p>
      <ul className="inc">
        <li>키트 파일</li>
        <li>사용 설명 eBook (PDF · EPUB)</li>
        {lec && <><li>클로드 코드 사용법</li><li>키트 설치 원격 지원</li><li>{sessions}</li><li className="hl">365일 1:1 채팅 지원</li></>}
      </ul>
    </div>
  </section>;
}
