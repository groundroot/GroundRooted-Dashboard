// 클로드 비디오 키트 결제: 상담 후 판매자가 /price?plan=... 링크를 구매자에게 보낸다.
// 금액은 항상 서버의 plans 표에서 정한다. 주소창의 금액·주문번호는 믿지 않는다.

// 마켓 오픈 할인: 2026-11-28(토) 24:00 KST까지 연 결제 화면은 할인가로 결제한다.
export const SALE_ENDS = Date.parse('2026-11-28T15:00:00Z');
// 마감 직전에 연 결제 화면에서 결제를 마치는 시간
const SALE_GRACE_MS = 30 * 60 * 1000;

// 강의 구성: 오픈 할인 기간은 1:1 강의 2회(총 2시간), 그 뒤 정가는 3주 과정 3회 강의 (판매 페이지 p-on/p-off와 같음)
export const plans = {
  kit: { name: '클로드 비디오 키트 for 파이널컷프로 — 키트', saleName: '클로드 비디오 키트 for 파이널컷프로 — 키트', sale: 100_000, regular: 300_000 },
  lesson: { name: '클로드 비디오 키트 for 파이널컷프로 — 키트 + 3회 강의(3주 과정)', saleName: '클로드 비디오 키트 for 파이널컷프로 — 키트 + 1:1 강의 2회(총 2시간)', sale: 300_000, regular: 500_000 },
  // 키트를 먼저 산 분이 나중에 신청하는 강의권. 키트 파일은 들어 있지 않고, 할인 기간에도 가격이 같다.
  pass: { name: '클로드 비디오 키트 for 파이널컷프로 — 1:1 강의권 2회(키트 구매자용)', saleName: '클로드 비디오 키트 for 파이널컷프로 — 1:1 강의권 2회(키트 구매자용)', sale: 300_000, regular: 300_000 },
} as const;
// 결제 화면의 상품 선택에 보이는 짧은 이름과 설명
export const planLabels: Record<keyof typeof plans, { label: string; note: string }> = {
  kit: { label: '키트', note: '키트 파일 · 사용 설명 eBook · 클로드 코드에 익숙한 분께 권장' },
  lesson: { label: '키트 + 1:1 강의', note: '키트 + 클로드 코드 사용법 · 키트 설치 원격 지원 · 365일 1:1 채팅 지원' },
  pass: { label: '키트 구매자 1:1 강의권', note: '이미 키트를 구입한 분 · 1:1 강의 2회(총 2시간) · 키트 파일 없음' },
};
// 계좌이체 입금 계좌 (/videokit/transfer 와 같음)
export const BANK = { bank: '토스뱅크', number: '1002-8619-7757', holder: '그라운드루티드' } as const;
// 강의 일정을 따로 조율하는 상품
export const hasLesson = (plan: PlanId) => plan === 'lesson' || plan === 'pass';
// 키트 파일을 보내는 상품
export const hasKit = (plan: PlanId) => plan !== 'pass';
export type PlanId = keyof typeof plans;
export type Tier = 's' | 'r'; // s = 오픈 할인가, r = 정가

export const isPlanId = (v: unknown): v is PlanId => typeof v === 'string' && Object.hasOwn(plans, v);
export const tierAt = (now = Date.now()): Tier => (now < SALE_ENDS ? 's' : 'r');
export const priceOf = (plan: PlanId, tier: Tier) => (tier === 's' ? plans[plan].sale : plans[plan].regular);
export const nameOf = (plan: PlanId, tier: Tier) => (tier === 's' ? plans[plan].saleName : plans[plan].name);

const ORDER_ID = /^vk-(kit|lesson|pass)-(s|r)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const makeOrderId = (plan: PlanId, tier: Tier, uuid: string) => `vk-${plan}-${tier}-${uuid}`;
export const isOrderId = (v: unknown): v is string => typeof v === 'string' && ORDER_ID.test(v);

// 승인 요청 전에 주문번호와 금액이 서버 가격표와 맞는지 확인한다.
// 할인가 주문(s)은 마감 + 30분까지만 받는다.
// anyTime: 가상계좌 입금 웹훅처럼, 할인 기간 안에 만든 주문이 나중에 입금되는 경우(마감 검사를 건너뛴다).
export function checkOrder(orderId: unknown, amount: unknown, now = Date.now(), { anyTime = false } = {}):
  { ok: true; plan: PlanId; tier: Tier; amount: number } | { ok: false } {
  if (typeof orderId !== 'string' || !ORDER_ID.test(orderId)) return { ok: false };
  const [, plan, tier] = orderId.split('-') as [string, PlanId, Tier];
  if (tier === 's' && !anyTime && now >= SALE_ENDS + SALE_GRACE_MS) return { ok: false };
  const value = Number(amount);
  if (!Number.isInteger(value) || value !== priceOf(plan, tier)) return { ok: false };
  return { ok: true, plan, tier, amount: value };
}

// 토스페이먼츠 결제위젯 키. 환경변수가 없으면 토스 문서에 공개된 테스트 키를 쓴다(실제 돈이 오가지 않음).
const DOCS_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
const DOCS_SECRET_KEY = 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';
export function tossKeys() {
  const clientKey = process.env.TOSS_CLIENT_KEY || DOCS_CLIENT_KEY;
  const secretKey = process.env.TOSS_SECRET_KEY || DOCS_SECRET_KEY;
  const live = clientKey.startsWith('live_');
  // 실제 키와 테스트 키를 섞어 쓰지 않는다.
  const consistent = live === secretKey.startsWith('live_');
  return { clientKey, secretKey, live, consistent };
}

// 결제창(카드 · 가상계좌)용 API 개별 연동 키. 둘 다 있으면 결제 페이지가 결제위젯 대신 결제창을 쓴다.
// 가상계좌 입금은 /api/webhooks/toss (DEPOSIT_CALLBACK)로 알림을 받아 키트 메일을 보낸다.
export function tossApiKeys() {
  const clientKey = process.env.TOSS_API_CLIENT_KEY || '';
  const secretKey = process.env.TOSS_API_SECRET_KEY || '';
  if (!clientKey || !secretKey) return null;
  const live = clientKey.startsWith('live_');
  const consistent = live === secretKey.startsWith('live_') && /_ck_/.test(clientKey) && /_sk_/.test(secretKey);
  return { clientKey, secretKey, live, consistent };
}
// 결제 승인 · 조회에 쓰는 시크릿 키: 결제창 키가 있으면 그것, 없으면 결제위젯 키.
export const paymentSecret = () => { const api = tossApiKeys(); return api ? api : tossKeys(); };
// 키트 메일은 실제(live) 키로 승인된 결제에만 보낸다. 테스트 키 결제는 돈이 오가지 않으므로 키트를 보내지 않는다.
export const kitMailAllowed = () => paymentSecret().live;
// 결제 화면에 '카드 결제는 심사 중 · 계좌이체 신청서로 구매' 안내를 띄울지.
// 테스트 키일 때는 항상 띄우고, 실제 키여도 VIDEOKIT_CARD_PENDING=1 이면 띄운다(결제창 진입은 그대로 둔다).
export const cardPending = () => !paymentSecret().live || process.env.VIDEOKIT_CARD_PENDING === '1';

// 가상계좌 은행 코드(토스페이먼츠 2자리) → 이름. 없는 코드는 코드 그대로 보여 준다.
const BANKS: Record<string, string> = {
  '39': '경남은행', '34': '광주은행', '12': '단위농협', '32': '부산은행', '45': '새마을금고', '64': '산림조합', '88': '신한은행',
  '48': '신협', '27': '씨티은행', '20': '우리은행', '71': '우체국', '50': '저축은행', '37': '전북은행', '35': '제주은행',
  '90': '카카오뱅크', '89': '케이뱅크', '92': '토스뱅크', '81': '하나은행', '54': '홍콩상하이은행', '03': 'IBK기업은행',
  '06': 'KB국민은행', '31': 'iM뱅크(대구)', '02': 'KDB산업은행', '11': 'NH농협은행', '23': 'SC제일은행', '07': 'Sh수협은행',
};
export const bankName = (code: unknown) => (typeof code === 'string' && BANKS[code]) || String(code ?? '');

// 가상계좌 입금 웹훅(DEPOSIT_CALLBACK) 판정. 웹훅 본문은 믿지 않고, 토스에서 다시 조회한 결제(payment)로 판단한다.
// 본문의 secret이 결제의 secret과 같고, 입금 완료(DONE)이며, 주문번호 · 금액이 가격표와 맞을 때만 보낸다.
export type TossPayment = { status?: string; orderId?: string; totalAmount?: number; secret?: string | null; method?: string; metadata?: Record<string, string> | null };
export function depositReady(body: { orderId?: unknown; secret?: unknown; status?: unknown }, payment: TossPayment | null) {
  if (!payment || typeof body.secret !== 'string' || !body.secret || payment.secret !== body.secret) return { ok: false as const, reason: 'secret' };
  if (payment.orderId !== body.orderId) return { ok: false as const, reason: 'order' };
  if (payment.status !== 'DONE') return { ok: false as const, reason: `status ${payment.status}` };
  const order = checkOrder(payment.orderId, payment.totalAmount, Date.now(), { anyTime: true });
  return order.ok ? { ok: true as const, order } : { ok: false as const, reason: 'amount' };
}
