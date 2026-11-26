// 결제 화면(/price)의 계좌이체 주문을 판매자 메일로 전달한다 (서버 전용, 신청 내용은 저장하지 않음).
// 필요한 환경변수: RESEND_API_KEY, VIDEOKIT_MAIL_FROM (Resend에서 인증한 보내는 주소)
// 선택: VIDEOKIT_APPLY_TO (받는 주소, 기본 sungchulkang@groundrooted.com)
import { isEmail } from '@/products/videokit-delivery';
import { priceOf, tierAt } from '@/products/videokit';
import { parseReceipt, receiptRows } from '@/products/videokit-receipt';

export const dynamic = 'force-dynamic';

const PLANS = { kit: '키트', lesson: '키트 + 1:1 강의', pass: '1:1 강의권 2회' } as const;
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

  const name = text(body.name, 50), email = text(body.email, 254), phone = text(body.phone, 20);
  const plan = text(body.plan, 10) as Plan;
  if (!name || !isEmail(email) || !/^[0-9\- ]{10,13}$/.test(phone) || !(plan in PLANS)) return Response.json({ error: 'bad' }, { status: 400 });
  // 영수증 요청 (없으면 '필요 없음'). 형식이 틀리면 받지 않는다.
  const receipt = parseReceipt(body.receipt, name);
  if (!receipt) return Response.json({ error: 'receipt' }, { status: 400 });

  const key = process.env.RESEND_API_KEY, from = process.env.VIDEOKIT_MAIL_FROM;
  if (!key || !from) {
    console.error('[videokit] apply form received but mail is not configured (RESEND_API_KEY / VIDEOKIT_MAIL_FROM)');
    return Response.json({ error: 'off' }, { status: 503 });
  }
  const to = process.env.VIDEOKIT_APPLY_TO || 'sungchulkang@groundrooted.com';
  const at = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(Date.now());
  const amount = `${new Intl.NumberFormat('ko-KR').format(priceOf(plan, tierAt()))}원`;
  const rows: [string, string][] = [['이름', name], ['이메일', email], ['전화번호', phone], ['상품', PLANS[plan]], ['금액', amount], ['신청 시각', at], ...receiptRows(receipt)];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], reply_to: email,
      subject: `[구매 신청] ${PLANS[plan]} · ${name}`,
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
