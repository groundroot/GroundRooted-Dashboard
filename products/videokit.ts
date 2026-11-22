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
} as const;
export type PlanId = keyof typeof plans;
export type Tier = 's' | 'r'; // s = 오픈 할인가, r = 정가

export const isPlanId = (v: unknown): v is PlanId => typeof v === 'string' && Object.hasOwn(plans, v);
export const tierAt = (now = Date.now()): Tier => (now < SALE_ENDS ? 's' : 'r');
export const priceOf = (plan: PlanId, tier: Tier) => (tier === 's' ? plans[plan].sale : plans[plan].regular);
export const nameOf = (plan: PlanId, tier: Tier) => (tier === 's' ? plans[plan].saleName : plans[plan].name);

const ORDER_ID = /^vk-(kit|lesson)-(s|r)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const makeOrderId = (plan: PlanId, tier: Tier, uuid: string) => `vk-${plan}-${tier}-${uuid}`;

// 승인 요청 전에 주문번호와 금액이 서버 가격표와 맞는지 확인한다.
// 할인가 주문(s)은 마감 + 30분까지만 받는다.
export function checkOrder(orderId: unknown, amount: unknown, now = Date.now()):
  { ok: true; plan: PlanId; tier: Tier; amount: number } | { ok: false } {
  if (typeof orderId !== 'string' || !ORDER_ID.test(orderId)) return { ok: false };
  const [, plan, tier] = orderId.split('-') as [string, PlanId, Tier];
  if (tier === 's' && now >= SALE_ENDS + SALE_GRACE_MS) return { ok: false };
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
