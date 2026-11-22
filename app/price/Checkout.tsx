'use client';
import { useEffect, useRef, useState } from 'react';

type Widgets = {
  setAmount(a: { currency: 'KRW'; value: number }): Promise<void>;
  renderPaymentMethods(o: { selector: string; variantKey: string }): Promise<unknown>;
  renderAgreement(o: { selector: string; variantKey: string }): Promise<unknown>;
  requestPayment(o: Record<string, unknown>): Promise<void>;
};
declare global {
  interface Window { TossPayments?: ((key: string) => { widgets(o: { customerKey: string }): Widgets }) & { ANONYMOUS: string } }
}
const SDK = 'https://js.tosspayments.com/v2/standard';

function loadSdk(): Promise<void> {
  if (window.TossPayments) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SDK; s.async = true;
    s.onload = () => resolve(); s.onerror = () => reject(new Error('sdk'));
    document.head.appendChild(s);
  });
}

export default function Checkout({ clientKey, orderId, orderName, amount }: { clientKey: string; orderId: string; orderName: string; amount: number }) {
  const widgets = useRef<Widgets | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    loadSdk().then(async () => {
      const toss = window.TossPayments!;
      const w = toss(clientKey).widgets({ customerKey: toss.ANONYMOUS });
      await w.setAmount({ currency: 'KRW', value: amount });
      await Promise.all([
        w.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
        w.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
      ]);
      if (alive) { widgets.current = w; setReady(true); }
    }).catch(() => alive && setError('결제 화면을 불러오지 못했습니다. 새로고침하거나 카카오톡으로 알려 주세요.'));
    return () => { alive = false; };
  }, [clientKey, amount]);

  async function pay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!widgets.current) return;
    const f = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      await widgets.current.requestPayment({
        orderId, orderName,
        customerName: String(f.get('name')).trim(),
        customerEmail: String(f.get('email')).trim(),
        // 결제 승인 후 서버가 이 값으로 키트 메일을 보낸다 (토스 결제 객체에 이메일·이름이 돌아오지 않음)
        metadata: { email: String(f.get('email')).trim().slice(0, 254), name: String(f.get('name')).trim().slice(0, 100) },
        customerMobilePhone: String(f.get('phone')).replace(/\D/g, ''),
        successUrl: `${location.origin}/price/success`,
        failUrl: `${location.origin}/price/fail`,
      });
    } catch {
      setError('결제가 완료되지 않았습니다. 다시 시도해 주세요.');
    } finally { setBusy(false); }
  }

  return <form onSubmit={pay}>
    <fieldset>
      <legend>받는 분 정보</legend>
      <label>이름<input name="name" required autoComplete="name" /></label>
      <label>휴대전화번호<input name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9\- ]{10,13}" placeholder="010-0000-0000" /></label>
      <label>이메일 <small>키트 다운로드 링크를 받을 주소</small><input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
    </fieldset>
    <div className="widget"><div id="payment-method" /><div id="agreement" /></div>
    <button className="pay-btn" disabled={!ready || busy}>{busy ? '결제 진행 중…' : `${new Intl.NumberFormat('ko-KR').format(amount)}원 결제하기`}</button>
    {error && <p className="err" role="alert">{error}</p>}
  </form>;
}
