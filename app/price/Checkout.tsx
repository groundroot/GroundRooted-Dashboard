'use client';
import { useEffect, useRef, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import ProductBox from './ProductBox';
import type { PlanId, Tier } from '@/products/videokit';
import { RECEIPT_LABEL, formatPhone, parseReceipt, receiptRows, type Receipt, type ReceiptKind } from '@/products/videokit-receipt';

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

export type PlanOption = { id: PlanId; label: string; note: string; amount: number; regular: number; orderId: string; orderName: string; kit: boolean; lesson: boolean };
type Props = {
  plans: PlanOption[]; initial: PlanId | null; tier: Tier;
  mode: 'widget' | 'window'; clientKey: string;
  // open: 카드 · 간편결제 사용 / pending: 심사 중(화면은 보이되 계좌이체를 기본으로) / off: 결제 설정 점검 중
  card: 'open' | 'pending' | 'off'; testKeys: boolean;
  autoMail: boolean; bank: { bank: string; number: string; holder: string }; linkDays: number; kakao: string; news: string;
};
// 쿠폰: 서버(/api/videokit/coupon)가 코드를 확인하고 상품별 금액 · 주문번호를 정해 준다.
type Offer = { amount: number; orderId: string; orderName: string };
type Coupon = { code: string; offers: Partial<Record<PlanId, Offer>> };
const COUPON_ERROR: Record<string, string> = {
  invalid: '유효하지 않은 코드입니다.', period: '쿠폰 사용 기간이 아닙니다.', busy: '확인 요청이 많습니다. 10분 뒤 다시 시도해 주세요.',
};

function CouponField({ coupon, onApply, onClear }: { coupon: Coupon | null; onApply(c: Coupon): void; onClear(): void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function apply() {
    if (!code.trim()) { setMsg('쿠폰 코드를 입력해 주세요.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/videokit/coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const d = await r.json().catch(() => null) as { ok?: boolean; error?: string; code?: string; offers?: Coupon['offers'] } | null;
      if (d?.ok && d.code && d.offers) { onApply({ code: d.code, offers: d.offers }); setCode(''); }
      else setMsg(COUPON_ERROR[d?.error ?? ''] ?? COUPON_ERROR.invalid);
    } catch { setMsg('쿠폰을 확인하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }
  if (coupon) return <div className="coupon applied" aria-live="polite">
    <span><b>쿠폰 {coupon.code}</b> 적용됨</span>
    <button type="button" className="copy" onClick={onClear}>쿠폰 빼기</button>
  </div>;
  return <div className="coupon">
    <label htmlFor="coupon-code">쿠폰 코드 <small>있으면 입력해 주세요</small></label>
    <div className="coupon-row">
      <input id="coupon-code" name="coupon_code" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={64} value={code}
        onChange={(e) => { setCode(e.target.value); setMsg(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
        aria-invalid={!!msg} aria-describedby={msg ? 'coupon-msg' : undefined} />
      <button type="button" className="coupon-btn" disabled={busy} onClick={apply}>{busy ? '확인 중…' : '적용'}</button>
    </div>
    {msg && <p id="coupon-msg" className="err" role="alert">{msg}</p>}
  </div>;
}

// 추가 기기: 서버(/api/videokit/device/check)가 구매자 키를 확인하고 그 키로 서명한 주문번호를 정해 준다.
type DeviceOffer = { key: string; used: number; limit: number; amount: number; orderId: string; orderName: string };
const KEY_ERROR: Record<string, string> = {
  invalid: '확인되지 않는 구매자 키입니다. 키트 메일의 VK-XXXX-XXXX-XXXX를 그대로 넣어 주세요.',
  unlimited: '이 키는 업데이트 기기 대수 제한이 없어 추가할 필요가 없습니다.',
  busy: '확인 요청이 많습니다. 10분 뒤 다시 시도해 주세요.', off: '지금은 추가 기기를 판매하지 않습니다.',
};

function KeyField({ offer, onApply, onClear }: { offer: DeviceOffer | null; onApply(o: DeviceOffer): void; onClear(): void }) {
  const [key, setKey] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function check() {
    if (!key.trim()) { setMsg('구매자 키를 입력해 주세요.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/videokit/device/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      const d = await r.json().catch(() => null) as { ok?: boolean; error?: string; key?: string; used?: number; limit?: number; offer?: { amount: number; orderId: string; orderName: string } } | null;
      if (d?.ok && d.key && d.offer && typeof d.limit === 'number') { onApply({ key: d.key, used: d.used ?? 0, limit: d.limit, ...d.offer }); setKey(''); }
      else setMsg(KEY_ERROR[d?.error ?? ''] ?? '구매자 키를 확인하지 못했습니다. 다시 시도해 주세요.');
    } catch { setMsg('구매자 키를 확인하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }
  if (offer) return <div className="coupon applied" aria-live="polite">
    <span><b>구매자 키 …-{offer.key.slice(-4)}</b> 확인됨 · 지금 {offer.limit}대(등록 {offer.used}대) → 결제 후 {offer.limit + 1}대</span>
    <button type="button" className="copy" onClick={onClear}>다른 키</button>
  </div>;
  return <div className="coupon">
    <label htmlFor="device-key">구매자 키 <small>키트 메일에 있는 VK-XXXX-XXXX-XXXX · 이 키에 기기 1대를 더합니다</small></label>
    <div className="coupon-row">
      <input id="device-key" name="device_key" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={30} value={key} placeholder="VK-XXXX-XXXX-XXXX"
        onChange={(e) => { setKey(e.target.value); setMsg(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } }}
        aria-invalid={!!msg} aria-describedby={msg ? 'device-key-msg' : undefined} />
      <button type="button" className="coupon-btn" disabled={busy} onClick={check}>{busy ? '확인 중…' : '확인'}</button>
    </div>
    {msg && <p id="device-key-msg" className="err" role="alert">{msg}</p>}
  </div>;
}

// 판매자 주문 메일 제목의 상품명 (app/api/videokit/apply 와 같음)
const MAIL_LABEL: Record<PlanId, string> = { kit: '키트', lesson: '키트 + 1:1 강의', pass: '1:1 강의권 2회', device: '업데이트 기기 1대 추가' };
const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;
const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// 이메일을 두 번 받아 철자가 다르면 제출이 막힌다 (setCustomValidity → 브라우저가 폼 제출을 멈춤).
function Buyer({ hint, onName, onPhone }: { hint: string; onName(v: string): void; onPhone(v: string): void }) {
  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const confirm = useRef<HTMLInputElement>(null);
  const mismatch = email2 !== '' && !sameEmail(email, email2);
  useEffect(() => { confirm.current?.setCustomValidity(mismatch ? '두 이메일 주소가 다릅니다. 철자를 확인해 주세요.' : ''); }, [mismatch]);
  return <fieldset>
    <legend>받는 분 정보</legend>
    <label>이름<input name="name" required maxLength={50} autoComplete="name" onChange={(e) => onName(e.target.value)} /></label>
    <label>이메일 <small>{hint}</small><input name="email" type="email" required autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>이메일 확인 <small>같은 주소를 한 번 더 입력해 주세요</small><input ref={confirm} name="email2" type="email" required autoComplete="off" maxLength={254} value={email2} onChange={(e) => setEmail2(e.target.value)} aria-invalid={mismatch} aria-describedby="email-mismatch" /></label>
    {mismatch && <p id="email-mismatch" className="err" role="alert">두 이메일 주소가 다릅니다. 철자를 확인해 주세요.</p>}
    <label>휴대전화번호<input name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9\- ]{10,13}" placeholder="010-0000-0000" onChange={(e) => onPhone(e.target.value)} /></label>
  </fieldset>;
}

// 영수증 요청: 필요 없음 / 간이영수증 / 현금영수증(소득공제 · 지출증빙). 카드 · 간편결제는 카드 매출전표가 나가므로 현금영수증을 고를 수 없다.
type ReceiptChoice = 'none' | 'simple' | 'cash';
type ReceiptInput = { to?: string; no?: string; phone?: string; biz?: string; org?: string };
const BIZ_PATTERN = '[0-9]{3}[\\- ]?[0-9]{2}[\\- ]?[0-9]{5}';
const PHONE_PATTERN = '010[\\- ]?[0-9]{4}[\\- ]?[0-9]{4}';

function receiptKind(choice: ReceiptChoice, use: 'income' | 'expense'): ReceiptKind {
  return choice === 'cash' ? (use === 'income' ? 'cash-income' : 'cash-expense') : choice;
}
// 화면 입력값 → { kind, to, no } (검사는 parseReceipt가 한다)
function receiptValue(kind: ReceiptKind, v: ReceiptInput, buyerName: string, buyerPhone: string) {
  if (kind === 'simple') return { kind, to: v.to ?? buyerName, no: v.no ?? '' };
  if (kind === 'cash-income') return { kind, to: buyerName, no: v.phone ?? (formatPhone(buyerPhone) ?? buyerPhone) };
  if (kind === 'cash-expense') return { kind, to: v.org ?? '', no: v.biz ?? '' };
  return { kind, to: '', no: '' };
}

function ReceiptFields({ card, choice, setChoice, use, setUse, value, set, buyerName, buyerPhone }: {
  card: boolean; choice: ReceiptChoice; setChoice(c: ReceiptChoice): void; use: 'income' | 'expense'; setUse(u: 'income' | 'expense'): void;
  value: ReceiptInput; set(v: ReceiptInput): void; buyerName: string; buyerPhone: string;
}) {
  const field = (k: keyof ReceiptInput) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...value, [k]: e.target.value });
  return <fieldset className="receipt">
    <legend>영수증</legend>
    <p className="hint">{card
      ? '카드 · 간편결제는 카드 매출전표가 자동 발급됩니다. 간이영수증이 따로 필요하면 골라 주세요.'
      : '간이영수증은 PDF로 이메일에 보내드리고, 현금영수증은 입금 확인 뒤 국세청 홈택스로 발급합니다.'}</p>
    <div className="choices">
      {(['none', 'simple', 'cash'] as const).filter((c) => !card || c !== 'cash').map((c) => <label key={c} className="method">
        <input type="radio" name="receipt" value={c} checked={choice === c} onChange={() => setChoice(c)} />
        <span><b>{c === 'none' ? '필요 없음' : c === 'simple' ? '간이영수증' : '현금영수증'}</b></span>
      </label>)}
    </div>
    {choice === 'simple' && <>
      <label>받는 분 <small>개인 이름 또는 단체명</small><input name="receipt_to" required maxLength={50} value={value.to ?? buyerName} onChange={field('to')} /></label>
      <label>단체 고유번호 · 사업자번호 <small>선택 · 단체 이름으로 받을 때</small><input name="receipt_no" inputMode="numeric" maxLength={14} pattern={BIZ_PATTERN} title="10자리 숫자 (000-00-00000)" placeholder="000-00-00000" value={value.no ?? ''} onChange={field('no')} /></label>
    </>}
    {choice === 'cash' && !card && <>
      <div className="choices two" role="radiogroup" aria-label="현금영수증 용도">
        <label className="method"><input type="radio" name="receipt_use" value="income" checked={use === 'income'} onChange={() => setUse('income')} /><span><b>소득공제용</b><small>개인 · 휴대폰 번호로 발급</small></span></label>
        <label className="method"><input type="radio" name="receipt_use" value="expense" checked={use === 'expense'} onChange={() => setUse('expense')} /><span><b>지출증빙용</b><small>사업자 · 단체 번호로 발급</small></span></label>
      </div>
      {use === 'income'
        ? <label>휴대폰 번호 <small>010-0000-0000 형식</small><input name="receipt_phone" required inputMode="tel" maxLength={13} pattern={PHONE_PATTERN} title="010-0000-0000 형식" placeholder="010-0000-0000" value={value.phone ?? (formatPhone(buyerPhone) ?? buyerPhone)} onChange={field('phone')} /></label>
        : <>
          <label>사업자번호 · 고유번호 <small>10자리 (000-00-00000)</small><input name="receipt_biz" required inputMode="numeric" maxLength={14} pattern={BIZ_PATTERN} title="10자리 숫자 (000-00-00000)" placeholder="000-00-00000" value={value.biz ?? ''} onChange={field('biz')} /></label>
          <label>단체명 <small>사업자등록증 · 고유번호증의 이름</small><input name="receipt_org" required maxLength={50} value={value.org ?? ''} onChange={field('org')} /></label>
        </>}
    </>}
  </fieldset>;
}

function buyer(f: FormData, receipt: Receipt, key?: string) {
  const name = String(f.get('name')).trim(), email = String(f.get('email')).trim();
  if (!sameEmail(email, String(f.get('email2') ?? ''))) throw new Error('email-mismatch');
  return {
    customerName: name, customerEmail: email,
    customerMobilePhone: String(f.get('phone')).replace(/\D/g, ''),
    // 결제 승인 후 서버가 이 값으로 키트 메일을 보낸다 (토스 결제 객체에 이메일 · 이름이 돌아오지 않음)
    // receipt: 영수증 요청({ kind, to, no }, JSON 한 칸). 토스 metadata는 키 5개까지라 하나로 묶는다.
    // key: 추가 기기 주문의 구매자 키(승인 때 주문번호 표식과 다시 대조)
    metadata: { email: email.slice(0, 254), name: name.slice(0, 100), receipt: JSON.stringify(receipt), ...(key ? { key } : {}) },
    successUrl: `${location.origin}/price/success`,
    failUrl: `${location.origin}/price/fail`,
  };
}

function Account({ bank, amount, name }: { bank: Props['bank']; amount: number; name?: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="order va">
    <b>은행</b><span>{bank.bank}</span>
    <b>계좌번호</b><span><strong className="acct-no">{bank.number}</strong> <button type="button" className="copy" onClick={() => navigator.clipboard?.writeText(bank.number.replace(/-/g, '')).then(() => setCopied(true))}>{copied ? '복사됨' : '복사'}</button></span>
    <b>예금주</b><span>{bank.holder}</span>
    <b>입금액</b><span><strong>{won(amount)}</strong></span>
    <b>입금자명</b><span>{name ? <><strong>{name}</strong> (주문자 이름)</> : '주문자 이름으로 보내 주세요'}</span>
  </div>;
}

export default function Checkout(p: Props) {
  // 주소의 plan 값을 모르면(initial = null) 아무 상품도 고르지 않은 채로 연다. 고르기 전에는 상품 목록만 보인다.
  const [planId, setPlanId] = useState<PlanId | null>(p.initial);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [deviceOffer, setDeviceOffer] = useState<DeviceOffer | null>(null);
  // 쿠폰이 맞는 상품은 서버가 준 쿠폰 금액 · 주문번호로 바꿔 보인다 (승인 때 서버가 주문번호로 다시 확인).
  // 추가 기기는 구매자 키를 확인한 뒤 받은 주문번호로 바꾼다(확인 전에는 주문번호가 비어 있어 결제할 수 없다).
  const withCoupon = (o: PlanOption): PlanOption & { coupon?: string } => {
    if (o.id === 'device') return deviceOffer ? { ...o, amount: deviceOffer.amount, orderId: deviceOffer.orderId, orderName: deviceOffer.orderName } : o;
    const f = coupon?.offers[o.id]; return f ? { ...o, ...f, coupon: coupon!.code } : o;
  };
  const chosen = p.plans.find((x) => x.id === planId);
  const plan = withCoupon(chosen ?? p.plans[0]);
  const [method, setMethod] = useState<'transfer' | 'card'>(p.card === 'open' ? 'card' : 'transfer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; mail?: string } | null>(null);
  const [done, setDone] = useState<{ name: string; email: string; plan: PlanOption & { coupon?: string }; receipt: Receipt } | null>(null);
  const widgets = useRef<Widgets | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const card = method === 'card' && p.card !== 'off';
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [rChoice, setRChoice] = useState<ReceiptChoice>('none');
  const [rUse, setRUse] = useState<'income' | 'expense'>('income');
  const [rInput, setRInput] = useState<ReceiptInput>({});
  // 카드 · 간편결제로 바꾸면 현금영수증 선택을 지운다 (카드 매출전표가 대신 나감).
  useEffect(() => { if (card && rChoice === 'cash') setRChoice('none'); }, [card, rChoice]);

  // 주소창의 ?plan= 을 고른 상품에 맞춘다 (새로고침해도 같은 상품)
  useEffect(() => {
    if (!planId) return;
    const u = new URL(location.href);
    if (u.searchParams.get('plan') !== planId) { u.searchParams.set('plan', planId); history.replaceState(null, '', u); }
  }, [planId]);

  // 결제위젯은 카드 · 간편결제를 처음 고를 때 한 번 불러온다. 상품을 바꾸면 금액만 다시 맞춘다.
  const amount = useRef(plan.amount);
  amount.current = plan.amount;
  const loading = useRef(false);
  useEffect(() => {
    if (!card || !chosen || p.mode !== 'widget' || loading.current) return;
    loading.current = true;
    loadSdk().then(async () => {
      const toss = window.TossPayments!;
      const w = toss(p.clientKey).widgets({ customerKey: toss.ANONYMOUS });
      await w.setAmount({ currency: 'KRW', value: amount.current });
      await Promise.all([
        w.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
        w.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
      ]);
      widgets.current = w; setWidgetReady(true);
    }).catch(() => { loading.current = false; setError({ msg: '결제 화면을 불러오지 못했습니다. 새로고침하거나 계좌이체로 주문해 주세요.' }); });
  }, [card, !!chosen, p.mode, p.clientKey]);
  useEffect(() => { if (widgetReady) widgets.current?.setAmount({ currency: 'KRW', value: plan.amount }); }, [widgetReady, plan.amount]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name')).trim();
    const receipt = parseReceipt(receiptValue(receiptKind(rChoice, rUse), rInput, name, String(f.get('phone') ?? '')), name, { card });
    if (!receipt) { setError({ msg: '영수증 정보를 확인해 주세요. 휴대폰은 010-0000-0000, 사업자번호 · 고유번호는 10자리입니다.' }); return; }
    const deviceKey = plan.id === 'device' ? deviceOffer?.key : undefined;
    if (plan.id === 'device' && (!deviceKey || !plan.orderId)) { setError({ msg: '먼저 구매자 키를 확인해 주세요.' }); document.getElementById('device-key')?.focus(); return; }
    setBusy(true); setError(null);
    try {
      if (!card) {
        // 계좌이체 주문: 주문 정보를 판매자 메일로 보낸다 (제목 "[구매 신청] <구성> · <이름>").
        const data = { name: String(f.get('name')).trim(), email: String(f.get('email')).trim(), phone: String(f.get('phone')).trim(), plan: plan.id, orderId: plan.orderId, coupon: plan.coupon ?? '', key: deviceKey ?? '', receipt, website: String(f.get('website') ?? '') };
        if (!sameEmail(data.email, String(f.get('email2') ?? ''))) throw new Error('email-mismatch');
        const r = await fetch('/api/videokit/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) {
          const e = await r.json().catch(() => null) as { error?: string } | null;
          throw new Error(r.status === 429 ? 'busy' : e?.error === 'coupon' || e?.error === 'period' || e?.error === 'key' || e?.error === 'unlimited' ? e.error : 'mail');
        }
        setDone({ name: data.name, email: data.email, plan, receipt });
        scrollTo({ top: 0 });
        return;
      }
      if (p.mode === 'window') {
        await loadSdk();
        const toss = window.TossPayments!;
        await toss(p.clientKey).payment({ customerKey: toss.ANONYMOUS }).requestPayment({
          method: 'CARD', amount: { currency: 'KRW', value: plan.amount }, orderId: plan.orderId, orderName: plan.orderName, ...buyer(f, receipt, deviceKey),
          card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
        });
      } else {
        if (!widgets.current) return;
        await widgets.current.requestPayment({ orderId: plan.orderId, orderName: plan.orderName, ...buyer(f, receipt, deviceKey) });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : '';
      if (!card) {
        const body = `이름: ${f.get('name')}\n이메일: ${f.get('email')}\n전화번호: ${f.get('phone')}\n상품: ${MAIL_LABEL[plan.id]} (${won(plan.amount)})\n${plan.coupon ? `쿠폰: ${plan.coupon}\n` : ''}${deviceKey ? `구매자 키: ${deviceKey}\n` : ''}${receiptRows(receipt).map(([k, v]) => `${k}: ${v}\n`).join('')}`;
        const mail = `mailto:sungchulkang@groundrooted.com?subject=${encodeURIComponent(`[구매 신청] ${MAIL_LABEL[plan.id]} · ${f.get('name')}`)}&body=${encodeURIComponent(body)}`;
        if (m === 'coupon' || m === 'period') setCoupon(null);
        if (m === 'key' || m === 'unlimited') { setDeviceOffer(null); setError({ msg: KEY_ERROR[m === 'key' ? 'invalid' : 'unlimited'] }); return; }
        setError(m === 'email-mismatch' ? { msg: '두 이메일 주소가 다릅니다. 철자를 확인해 주세요.' } : m === 'coupon' || m === 'period' ? { msg: `${m === 'period' ? '쿠폰 사용 기간이 아닙니다' : '유효하지 않은 쿠폰 코드입니다'}. 쿠폰을 뺐으니 금액을 확인하고 다시 주문해 주세요.` } : m === 'busy' ? { msg: '주문이 잠시 몰렸습니다. 10분 뒤 다시 시도해 주세요.' } : { msg: '주문을 보내지 못했습니다. 다시 시도하거나 메일로 주문해 주세요.', mail });
      } else setError({ msg: '결제가 완료되지 않았습니다. 다시 시도하거나 계좌이체로 주문해 주세요.' });
    } finally { setBusy(false); }
  }

  if (done) return <section className="placed" aria-live="polite">
    <h2>주문이 접수되었습니다</h2>
    <p className="lede">{done.plan.label} · {won(done.plan.amount)}{done.plan.coupon && ` (쿠폰 ${done.plan.coupon})`}. 아래 계좌로 입금해 주세요.</p>
    <Account bank={p.bank} amount={done.plan.amount} name={done.name} />
    <ul className="steps">
      <li>입금은 판매자가 직접 확인합니다. 따로 알려 주시지 않아도 됩니다.</li>
      {done.plan.kit
        ? <li>입금이 확인되면 <b>{done.email}</b>로 키트 다운로드 링크({p.linkDays}일 동안 열림)와 사용 설명서를 보내드립니다.</li>
        : done.plan.id === 'device'
          ? <li>입금이 확인되면 구매자 키에 업데이트 기기 1대를 더하고 <b>{done.email}</b>로 알려 드립니다.</li>
          : <li>입금이 확인되면 <b>{done.email}</b>로 안내드리고, 카카오톡으로 강의 일정을 조율합니다.</li>}
      {done.plan.lesson && done.plan.kit && <li>강의 일정은 입금 확인 뒤 카카오톡으로 조율합니다.</li>}
      {done.receipt.kind !== 'none' && <li>{RECEIPT_LABEL[done.receipt.kind]} 신청을 받았습니다. {done.receipt.kind === 'simple' ? '간이영수증은 PDF로 이메일에 보내드립니다.' : `입금 확인 뒤 ${done.receipt.no} 번호로 홈택스에서 발급합니다.`}</li>}
      <li>다른 이름으로 입금하셨다면 <a href={p.kakao} target="_blank" rel="noopener">카카오톡 1:1 문의</a>로 알려 주세요.</li>
    </ul>
    <a className="btn btn-ghost" href="/videokit">상품 페이지로</a>
  </section>;

  const sale = plan.amount < plan.regular && !plan.coupon;
  const payLabel = !card ? `${won(plan.amount)} 계좌이체로 주문하기` : p.card === 'pending' && p.testKeys ? `${won(plan.amount)} 테스트 결제 (심사용)` : `${won(plan.amount)} 결제하기`;
  return <form onSubmit={submit}>
    <fieldset className="pick">
      <legend>상품 선택</legend>
      {p.plans.map(withCoupon).map((o) => <label key={o.id} className="method">
        <input type="radio" name="plan" value={o.id} checked={o.id === planId} onChange={() => setPlanId(o.id)} />
        {o.id === 'device'
          ? <span className="thumb thumb-icon" aria-hidden="true"><MonitorSmartphone size={26} strokeWidth={1.75} /></span>
          : <img className="thumb" src={`/videokit/plan-${o.id}.png`} alt="" width={52} height={52} />}
        <span><b>{o.label}</b><small>{o.note}</small></span>
        <em>{o.amount < o.regular && <s>{won(o.regular)}</s>}{won(o.amount)}</em>
      </label>)}
    </fieldset>

    {!chosen ? <p className="small" role="note">위 목록에서 상품을 골라 주세요.</p> : <>
    <ProductBox plan={plan.id} tier={plan.coupon ? 'c' : p.tier} />
    <div className="order">
      <b>{plan.orderName}</b>
      <span>{plan.kit ? `결제가 확인되면 적어 주신 이메일로 키트 다운로드 링크(맥용 · 윈도우용, ${p.linkDays}일 동안 열림)와 사용 설명서를 보내드립니다.` : plan.id === 'device' ? '결제가 확인되면 아래 구매자 키에 업데이트를 받을 기기 1대를 더합니다. 키트 파일은 들어 있지 않고, 쿠폰은 적용되지 않습니다.' : '키트를 이미 구입하신 분을 위한 강의권입니다. 키트 파일은 들어 있지 않습니다.'}{plan.lesson && ' 강의 일정은 카카오톡으로 따로 조율합니다.'}</span>
      <div className="amt" aria-live="polite"><span className="sr">결제 금액 </span>{(sale || (plan.coupon && plan.amount < plan.regular)) && <s className="was">{won(plan.regular)}</s>}{won(plan.amount)}</div>
      {sale && <span className="sale">마켓 오픈 할인 · 11월 28일(토) 23:59까지 주문 · 이 화면은 마감 뒤 30분까지 할인가</span>}
      {plan.coupon && <span className="sale">쿠폰 {plan.coupon} 적용가</span>}
    </div>
    {/* 쿠폰 대상: 키트 · 키트 + 1:1 강의 (강의권 · 추가 기기 제외) */}
    {plan.id !== 'pass' && plan.id !== 'device' && <CouponField coupon={coupon} onApply={setCoupon} onClear={() => setCoupon(null)} />}
    {plan.id === 'device' && <KeyField offer={deviceOffer} onApply={setDeviceOffer} onClear={() => setDeviceOffer(null)} />}

    <Buyer hint={plan.kit ? '비디오 키트를 받으실 주소' : plan.id === 'device' ? '기기 추가 확인 메일을 받을 주소' : '강의 일정 안내를 받을 주소'} onName={setBuyerName} onPhone={setBuyerPhone} />
    <label className="hp" aria-hidden="true">웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>

    <fieldset className="methods">
      <legend>결제 수단</legend>
      <label className="method"><input type="radio" name="method" value="transfer" checked={!card} onChange={() => setMethod('transfer')} />
        <span><b>계좌이체</b><small>아래 계좌로 직접 입금합니다. 판매자가 입금을 확인한 뒤 {plan.kit ? '키트를 이메일로 보내드립니다.' : plan.id === 'device' ? '구매자 키에 기기 1대를 더합니다.' : '강의 일정을 안내드립니다.'}</small></span></label>
      <label className={p.card === 'open' ? 'method' : 'method soon'}><input type="radio" name="method" value="card" checked={card} disabled={p.card === 'off'} onChange={() => setMethod('card')} />
        <span><b>카드 · 간편결제 <i className="tag">토스페이먼츠</i>{p.card !== 'open' && <i className="tag soon">심사 중 · 곧 열립니다</i>}</b>
          <small>{p.card === 'open' ? `신용 · 체크카드, 간편결제로 바로 결제합니다.${plan.kit && p.autoMail ? ' 결제가 끝나면 바로 키트 메일이 갑니다.' : ''}` : p.card === 'pending' ? '토스페이먼츠 가맹 심사가 끝나면 열립니다. 지금은 계좌이체로 주문해 주세요.' : '결제 설정을 점검하고 있습니다. 계좌이체로 주문해 주세요.'}</small></span></label>
    </fieldset>

    {!card && <div className="transfer">
      <Account bank={p.bank} amount={plan.amount} />
      <p className="small">주문하기를 누르면 주문 정보가 판매자에게 전달됩니다. 위 계좌로 입금해 주시면 판매자가 확인한 뒤 {plan.kit ? `적어 주신 이메일로 키트 다운로드 링크와 사용 설명서를 보내드립니다.` : plan.id === 'device' ? '구매자 키에 업데이트 기기 1대를 더하고 이메일로 알려 드립니다.' : '카카오톡으로 강의 일정을 조율합니다.'}</p>
    </div>}
    {card && p.card === 'pending' && <div className="test" role="note">
      <p><b>카드 · 간편결제는 심사 중입니다.</b> 지금은 계좌이체로 주문해 주세요.</p>
      {p.testKeys && <p>아래 결제창은 심사용 테스트 화면이라 결제해도 돈이 빠져나가지 않고, 상품도 보내지 않습니다.</p>}
    </div>}
    {p.mode === 'widget' && <div className="widget" hidden={!card}><div id="payment-method" /><div id="agreement" /></div>}

    <ReceiptFields card={card} choice={rChoice} setChoice={setRChoice} use={rUse} setUse={setRUse} value={rInput} set={setRInput} buyerName={buyerName} buyerPhone={buyerPhone} />

    <button className="pay-btn" disabled={busy || (card && p.mode === 'widget' && !widgetReady)}>{busy ? '처리 중…' : payLabel}</button>
    {error && <p className="err" role="alert">{error.msg}{error.mail && <> <a href={error.mail}>메일로 주문하기</a></>}</p>}

    <dl className="terms-box">
      <div><dt>제공 방법</dt><dd>{plan.kit
        ? <>결제(입금)가 확인되면 적어 주신 이메일로 키트 다운로드 링크(맥용 · 윈도우용)와 사용 설명 eBook(PDF · EPUB), 설치 안내를 보내드립니다. 링크는 {p.linkDays}일 뒤 삭제되며, 맥용 · 윈도우용을 합쳐 10회까지 내려받을 수 있습니다.{plan.lesson && ' 강의는 카카오톡으로 일정을 조율합니다.'} 업데이트는 키트 안에서 구매자 키로 /videokit update를 실행해 받고(새 버전 소식은 <a href={p.news} target="_blank" rel="noopener">업데이트 소식 · 정보 공유 오픈채팅방</a> 공지), 후속지원은 구매일로부터 1년입니다.</>
        : plan.id === 'device' ? '결제(입금)가 확인되면 구매자 키에 업데이트를 받을 기기 1대를 더합니다(맥 · 윈도우 합산). 새 기기에서 키트를 설치하거나 /videokit update를 실행하면 그 기기가 등록됩니다. 키트 파일은 들어 있지 않습니다.'
        : '결제(입금)가 확인되면 카카오톡으로 1:1 강의 일정(2회 · 총 2시간)을 조율합니다. 키트 파일은 들어 있지 않습니다.'}{plan.lesson && ' 1:1 강의는 대표 강성철이 직접 실시간으로 진행합니다. 점프데스크탑 원격 연결과 카카오톡 보이스톡을 쓰며, 회당 1시간입니다.'}</dd></div>
      {plan.kit && <div>
        <dt>지원 환경</dt>
        <dd>
          macOS · Windows(미리보기) (맥용 · 윈도우용을 함께 받습니다).<br />
          Claude Pro 이상 구독이 필요합니다. 자세한 조건은 <a href="/videokit#env">지원 환경</a>을 확인해 주세요.
        </dd>
      </div>}
      <div><dt>영수증</dt><dd>간이영수증 또는 현금영수증을 결제 화면에서 신청할 수 있습니다.</dd></div>
      <div><dt>환불</dt><dd>키트 파일을 받기 전에는 결제일로부터 7일 안에 요청하시면 전액 환불됩니다. 파일을 받은 뒤에는 디지털 콘텐츠 특성상 청약철회가 제한됩니다.{plan.lesson && ' 1:1 강의는 첫 강의 전이면 강의 금액 전액, 진행된 뒤면 남은 회차만큼 환불합니다.'} 자세한 내용은 <a href="/videokit#refund">환불 안내</a>와 <a href="/videokit/terms#refund">이용약관</a> 제8조를 확인해 주세요.</dd></div>
    </dl>
    </>}
  </form>;
}
