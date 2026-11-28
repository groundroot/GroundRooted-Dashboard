// 결제 화면(/price)의 추가 기기 상품: 구매자 키를 확인하고, 그 키로 서명한 주문번호와 금액을 돌려준다.
// 금액은 승인 때 주문번호로 다시 계산하고(products/videokit.ts checkOrder), 표식은 토스 metadata의 키로 다시 확인한다(products/videokit-devices.ts).
// VIDEOKIT_DEVICE_ADDON_ON 이 꺼져 있으면(기본) 받지 않는다. 쿠폰은 적용되지 않는다.
import { db } from '@/products/videokit-license';
import { deviceAddonOn, deviceKeyStatus, makeDeviceOrderId } from '@/products/videokit-devices';
import { nameOf, priceOf } from '@/products/videokit';

export const dynamic = 'force-dynamic';

// 키 추측을 늦추려고 같은 IP에서 10분에 10번까지만 받는다 (인스턴스 메모리, 완벽한 차단은 아님).
const WINDOW_MS = 10 * 60 * 1000, LIMIT = 10;
const hits = new Map<string, number[]>();
function tooMany(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
  return recent.length > LIMIT;
}
const noStore = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  if (!deviceAddonOn() || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ ok: false, error: 'off' }, { status: 404, headers: noStore });
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooMany(ip)) return Response.json({ ok: false, error: 'busy' }, { status: 429, headers: { 'Retry-After': '600', ...noStore } });
  const body = await req.json().catch(() => null) as { key?: unknown } | null;
  try {
    const st = await deviceKeyStatus(db(), body?.key);
    if (!st.ok) return Response.json({ ok: false, error: st.error }, { status: 400, headers: noStore });
    const orderId = makeDeviceOrderId(st.key);
    if (!orderId) return Response.json({ ok: false, error: 'off' }, { status: 404, headers: noStore });
    return Response.json({ ok: true, key: st.key, used: st.used, limit: st.limit, offer: { amount: priceOf('device', 'r'), orderName: nameOf('device', 'r'), orderId } }, { headers: noStore });
  } catch (e) {
    console.error('[videokit] device check failed', (e as Error).message);
    return Response.json({ ok: false, error: 'unavailable' }, { status: 503, headers: noStore });
  }
}
