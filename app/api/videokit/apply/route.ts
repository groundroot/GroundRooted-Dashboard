// 결제 화면(/price)의 계좌이체 주문을 판매자 메일로 전달한다 (서버 전용, 신청 내용은 저장하지 않음).
// 필요한 환경변수: RESEND_API_KEY, VIDEOKIT_MAIL_FROM (Resend에서 인증한 보내는 주소)
// 선택: VIDEOKIT_APPLY_TO (받는 주소, 기본 sungchulkang@groundrooted.com)
import { isEmail } from '@/products/videokit-delivery';
import { couponPlan, couponWindow, matchCoupon, priceOf, transferTier } from '@/products/videokit';
import { parseReceipt, receiptRows } from '@/products/videokit-receipt';
import { db } from '@/products/videokit-license';
import { deviceAddonOn, deviceKeyStatus } from '@/products/videokit-devices';

export const dynamic = 'force-dynamic';

const PLANS = { kit: '키트', lesson: '키트 + 1:1 강의', pass: '1:1 강의권 2회', device: '업데이트 기기 1대 추가' } as const;
type Plan = keyof typeof PLANS;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : '').slice(0, max);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// 같은 IP에서 10분에 5번까지만 받는다 (메일함 폭주 · Resend 사용량 소진 방지).
// 서버 인스턴스 메모리에 두므로 인스턴스마다 따로 센다. 완벽한 차단이 아니라 반복 호출을 늦추는 장치다.
const WINDOW_MS = 10 * 60 * 1000, LIMIT = 5;
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
  if (tooMany(ip)) return Response.json({ error: 'busy' }, { status: 429, headers: { 'Retry-After': '600' } });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'bad' }, { status: 400 });
  // 사람에게 보이지 않는 칸이 채워져 있으면 스팸 봇이다. 받은 척만 한다.
  if (text(body.website, 200)) return Response.json({ ok: true });

  // 이름은 한 줄로 (줄바꿈으로 메일 본문에 가짜 '영수증:' 줄을 끼워 넣지 못하게)
  const name = text(body.name, 50).replace(/\s+/g, ' '), email = text(body.email, 254), phone = text(body.phone, 20);
  const plan = text(body.plan, 10) as Plan;
  if (!name || !isEmail(email) || !/^[0-9\- ]{10,13}$/.test(phone) || !(plan in PLANS)) return Response.json({ error: 'bad' }, { status: 400 });
  // 영수증 요청 (없으면 '필요 없음'). 형식이 틀리면 받지 않는다.
  const receipt = parseReceipt(body.receipt, name);
  if (!receipt) return Response.json({ error: 'receipt' }, { status: 400 });

  // 쿠폰: 코드를 보냈으면 서버에서 다시 확인한다. 틀리거나 대상 상품이 아니면 주문을 받지 않는다(화면 입금액과 메일 금액이 어긋나지 않게).
  const sentCoupon = text(body.coupon, 64);
  const coupon = sentCoupon ? matchCoupon(sentCoupon) : null;
  if (sentCoupon && (!coupon || !couponPlan(plan))) return Response.json({ error: 'coupon' }, { status: 400 });
  if (coupon && couponWindow() !== 'open') return Response.json({ error: 'period' }, { status: 400 });

  // 추가 기기: VIDEOKIT_DEVICE_ADDON_ON 일 때만, 구매자 키가 맞고 대수 제한이 있는 키일 때만 받는다(쿠폰 미적용).
  // 입금이 확인되면 운영봇이 scripts/videokit-devices.mjs add <키> 1 --order <주문번호> 로 반영한다. 메일에는 키 전체를 적는다(운영봇이 그 키로 실행).
  let deviceRows: [string, string][] = [];
  if (plan === 'device') {
    if (!deviceAddonOn()) return Response.json({ error: 'bad' }, { status: 400 });
    if (coupon) return Response.json({ error: 'coupon' }, { status: 400 });
    let st: Awaited<ReturnType<typeof deviceKeyStatus>>;
    try { st = await deviceKeyStatus(db(), body.key); }
    catch (e) { console.error('[videokit] apply device key check failed', (e as Error).message); return Response.json({ error: 'failed' }, { status: 502 }); }
    if (!st.ok) return Response.json({ error: st.error === 'unlimited' ? 'unlimited' : 'key' }, { status: 400 });
    const oid = /^vk-device-r-[0-9a-f-]{36}-[0-9a-f]{12}$/.test(text(body.orderId, 64)) ? text(body.orderId, 64) : '';
    deviceRows = [['구매자 키', st.key], ['지금 허용 대수', `${st.limit}대 (등록 ${st.used}대)`], ['주문번호', oid || '-'], ['반영 명령', `node scripts/videokit-devices.mjs add ${st.key} 1${oid ? ` --order ${oid}` : ''}`]];
  }

  const key = process.env.RESEND_API_KEY, from = process.env.VIDEOKIT_MAIL_FROM;
  if (!key || !from) {
    console.error('[videokit] apply form received but mail is not configured (RESEND_API_KEY / VIDEOKIT_MAIL_FROM)');
    return Response.json({ error: 'off' }, { status: 503 });
  }
  const to = process.env.VIDEOKIT_APPLY_TO || 'sungchulkang@groundrooted.com';
  const at = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(Date.now());
  // 마감 전에 연 결제 화면에서 낸 주문은 마감 뒤 30분까지 할인가로 적는다 (화면에 보인 입금액과 같게).
  // 쿠폰이 맞으면 쿠폰가(할인가와 같음). 운영봇이 입금 금액을 이 '금액'과 '쿠폰' 줄로 대조한다.
  const amount = `${new Intl.NumberFormat('ko-KR').format(priceOf(plan, coupon ? 'c' : transferTier(body.orderId, plan)))}원`;
  const rows: [string, string][] = [['이름', name], ['이메일', email], ['전화번호', phone], ['상품', PLANS[plan]], ['금액', amount], ['쿠폰', coupon ? `적용 · ${coupon}` : '없음'], ['신청 시각', at], ...deviceRows, ...receiptRows(receipt)];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], reply_to: email,
      subject: `[구매 신청] ${PLANS[plan]}${coupon ? ' · 쿠폰' : ''} · ${name}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
      html: `<table style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:15px;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>`,
    }),
  }).catch(() => null);
  if (!res?.ok) {
    console.error('[videokit] apply mail failed', res?.status);
    return Response.json({ error: 'failed' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
