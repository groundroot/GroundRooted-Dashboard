// 결제 화면(/price)의 쿠폰 코드 확인. 맞는 코드면 쿠폰 대상 상품(키트 · 키트 + 1:1 강의)마다
// 서버가 정한 금액과 쿠폰 주문번호를 돌려준다. 금액은 승인 때 주문번호로 다시 계산한다(products/videokit.ts checkOrder).
// 코드는 환경변수 VIDEOKIT_COUPON_CODES, 사용 기간은 VIDEOKIT_COUPON_START · VIDEOKIT_COUPON_END 에서만 읽는다. 비어 있으면 모든 코드가 '유효하지 않은 코드'.
import { randomUUID } from 'node:crypto';
import { COUPON_PLANS, couponWindow, makeCouponOrderId, matchCoupon, nameOf, priceOf } from '@/products/videokit';

export const dynamic = 'force-dynamic';

// 코드 추측을 늦추려고 같은 IP에서 10분에 10번까지만 받는다 (인스턴스 메모리, 완벽한 차단은 아님).
const WINDOW_MS = 10 * 60 * 1000, LIMIT = 10;
const hits = new Map<string, number[]>();
function tooMany(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
  return recent.length > LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooMany(ip)) return Response.json({ ok: false, error: 'busy' }, { status: 429, headers: { 'Retry-After': '600' } });
  const body = await req.json().catch(() => null) as { code?: unknown } | null;
  const code = matchCoupon(body?.code);
  if (!code) return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  // 맞는 코드라도 사용 기간(VIDEOKIT_COUPON_START ~ END) 밖이면 받지 않는다.
  if (couponWindow() !== 'open') return Response.json({ ok: false, error: 'period' }, { status: 400 });
  const offers = Object.fromEntries(COUPON_PLANS.map((plan) => [plan, {
    amount: priceOf(plan, 'c'), orderName: nameOf(plan, 'c'), orderId: makeCouponOrderId(plan, code, randomUUID())!,
  }]));
  return Response.json({ ok: true, code, offers }, { headers: { 'Cache-Control': 'no-store' } });
}
