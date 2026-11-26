'use client';
import { useEffect, useRef, useState } from 'react';

type Widgets = {
  setAmount(a: { currency: 'KRW'; value: number }): Promise<void>;
  renderPaymentMethods(o: { selector: string; variantKey: string }): Promise<unknown>;
  renderAgreement(o: { selector: string; variantKey: string }): Promise<unknown>;
  requestPayment(o: Record<string, unknown>): Promise<void>;
};
type PaymentWindow = { requestPayment(o: Record<string, unknown>): Promise<void> };
declare global {
  interface Window { TossPayments?: ((key: string) => { widgets(o: { customerKey: string }): Widgets; payment(o: { customerKey: string }): PaymentWindow }) & { ANONYMOUS: string } }
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

// mode 'window': 결제창(API 개별 연동 키) — 카드 또는 가상계좌(무통장 입금). 가상계좌는 입금되면 웹훅으로 키트 메일이 나간다.
// mode 'widget': 결제위젯(결제위젯 연동 키). 결제창 키가 없을 때만 쓴다.
// kit: 키트 파일을 보내는 상품인지 (강의권은 false)
export default function Checkout({ clientKey, orderId, orderName, amount, mode = 'widget', autoMail = false, kit = true }: { clientKey: string; orderId: string; orderName: string; amount: number; mode?: 'widget' | 'window'; autoMail?: boolean; kit?: boolean }) {
  if (mode === 'window') return <WindowCheckout clientKey={clientKey} orderId={orderId} orderName={orderName} amount={amount} autoMail={autoMail} kit={kit} />;
  return <WidgetCheckout clientKey={clientKey} orderId={orderId} orderName={orderName} amount={amount} kit={kit} />;
}

function Buyer({ kit }: { kit: boolean }) {
  return <fieldset>
    <legend>받는 분 정보</legend>
    <label>이름<input name="name" required autoComplete="name" /></label>
    <label>휴대전화번호<input name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9\- ]{10,13}" placeholder="010-0000-0000" /></label>
    <label>이메일 <small>{kit ? '키트 다운로드 링크를 받을 주소' : '강의 일정 안내를 받을 주소'}</small><input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
  </fieldset>;
}

function buyer(f: FormData) {
  const name = String(f.get('name')).trim(), email = String(f.get('email')).trim();
  return {
    customerName: name, customerEmail: email,
    customerMobilePhone: String(f.get('phone')).replace(/\D/g, ''),
    // 결제 승인 · 입금 후 서버가 이 값으로 키트 메일을 보낸다 (토스 결제 객체에 이메일 · 이름이 돌아오지 않음)
    metadata: { email: email.slice(0, 254), name: name.slice(0, 100) },
    successUrl: `${location.origin}/price/success`,
    failUrl: `${location.origin}/price/fail`,
  };
}

function WindowCheckout({ clientKey, orderId, orderName, amount, autoMail, kit }: { clientKey: string; orderId: string; orderName: string; amount: number; autoMail: boolean; kit: boolean }) {
  const [method, setMethod] = useState<'VIRTUAL_ACCOUNT' | 'CARD'>('VIRTUAL_ACCOUNT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { loadSdk().catch(() => setError('결제 화면을 불러오지 못했습니다. 새로고침하거나 카카오톡으로 알려 주세요.')); }, []);

  async function pay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      await loadSdk();
      const toss = window.TossPayments!;
      await toss(clientKey).payment({ customerKey: toss.ANONYMOUS }).requestPayment({
        method, amount: { currency: 'KRW', value: amount }, orderId, orderName, ...buyer(f),
        ...(method === 'VIRTUAL_ACCOUNT'
          ? { virtualAccount: { cashReceipt: { type: '소득공제' }, useEscrow: false, validHours: 72 } }
          : { card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false } }),
      });
    } catch {
      setError('결제가 완료되지 않았습니다. 다시 시도해 주세요.');
    } finally { setBusy(false); }
  }

  return <form onSubmit={pay}>
    <Buyer kit={kit} />
    <fieldset className="methods">
      <legend>결제 방법</legend>
      <label className="method"><input type="radio" name="method" value="VIRTUAL_ACCOUNT" checked={method === 'VIRTUAL_ACCOUNT'} onChange={() => setMethod('VIRTUAL_ACCOUNT')} />
        <span><b>계좌이체 (가상계좌)</b><small>주문마다 입금 계좌가 따로 만들어집니다. {!kit ? '' : autoMail ? '입금하면 바로 키트 메일이 갑니다. ' : '입금이 확인되면 키트를 이메일로 보내드립니다. '}3일 안에 입금해 주세요.</small></span></label>
      <label className="method"><input type="radio" name="method" value="CARD" checked={method === 'CARD'} onChange={() => setMethod('CARD')} />
        <span><b>신용 · 체크카드</b><small>{!kit ? '결제가 확인되면 강의 일정을 연락드립니다.' : autoMail ? '결제가 끝나면 바로 키트 메일이 갑니다.' : '결제가 확인되면 키트를 이메일로 보내드립니다.'}</small></span></label>
    </fieldset>
    <button className="pay-btn" disabled={busy}>{busy ? '결제 진행 중…' : method === 'VIRTUAL_ACCOUNT' ? `${new Intl.NumberFormat('ko-KR').format(amount)}원 입금 계좌 받기` : `${new Intl.NumberFormat('ko-KR').format(amount)}원 카드 결제하기`}</button>
    {error && <p className="err" role="alert">{error}</p>}
  </form>;
}

function WidgetCheckout({ clientKey, orderId, orderName, amount, kit }: { clientKey: string; orderId: string; orderName: string; amount: number; kit: boolean }) {
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
      await widgets.current.requestPayment({ orderId, orderName, ...buyer(f) });
    } catch {
      setError('결제가 완료되지 않았습니다. 다시 시도해 주세요.');
    } finally { setBusy(false); }
  }

  return <form onSubmit={pay}>
    <Buyer kit={kit} />
    <div className="widget"><div id="payment-method" /><div id="agreement" /></div>
    <button className="pay-btn" disabled={!ready || busy}>{busy ? '결제 진행 중…' : `${new Intl.NumberFormat('ko-KR').format(amount)}원 결제하기`}</button>
    {error && <p className="err" role="alert">{error}</p>}
  </form>;
}
