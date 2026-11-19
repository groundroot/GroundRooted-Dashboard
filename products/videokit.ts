// 클로드 비디오 키트 결제: 상담 후 판매자가 /price?plan=... 링크를 구매자에게 보낸다.
// 금액은 항상 서버의 plans 표에서 정한다. 주소창의 금액·주문번호는 믿지 않는다.
export const plans = {
  kit: { name: '클로드 비디오 키트 for 파이널컷프로 — 키트만 제공', amount: 300_000 },
  lesson: { name: '클로드 비디오 키트 for 파이널컷프로 — 키트 + 3회 강의', amount: 500_000 },
} as const;
export type PlanId = keyof typeof plans;

export const isPlanId = (v: unknown): v is PlanId => typeof v === 'string' && Object.hasOwn(plans, v);

const ORDER_ID = /^vk-(kit|lesson)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const makeOrderId = (plan: PlanId, uuid: string) => `vk-${plan}-${uuid}`;

// 승인 요청 전에 주문번호와 금액이 서버 가격표와 맞는지 확인한다.
export function checkOrder(orderId: unknown, amount: unknown): { ok: true; plan: PlanId; amount: number } | { ok: false } {
  if (typeof orderId !== 'string' || !ORDER_ID.test(orderId)) return { ok: false };
  const plan = orderId.split('-')[1] as PlanId;
  const value = Number(amount);
  if (!Number.isInteger(value) || value !== plans[plan].amount) return { ok: false };
  return { ok: true, plan, amount: value };
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
