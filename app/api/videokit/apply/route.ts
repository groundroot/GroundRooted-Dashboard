// 상품 페이지의 '신청서 작성' 팝업이 보낸 신청을 판매자 메일로 전달한다 (서버 전용, 신청 내용은 저장하지 않음).
// 필요한 환경변수: RESEND_API_KEY, VIDEOKIT_MAIL_FROM (Resend에서 인증한 보내는 주소)
// 선택: VIDEOKIT_APPLY_TO (받는 주소, 기본 sungchulkang@groundrooted.com)
import { isEmail } from '@/products/videokit-delivery';

export const dynamic = 'force-dynamic';

const PLANS = { kit: '키트', lesson: '키트 + 1:1 강의', pass: '1:1 강의권 2회' } as const;
type Plan = keyof typeof PLANS;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : '').slice(0, max);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'bad' }, { status: 400 });
  // 사람에게 보이지 않는 칸이 채워져 있으면 스팸 봇이다. 받은 척만 한다.
  if (text(body.website, 200)) return Response.json({ ok: true });

  const name = text(body.name, 50), email = text(body.email, 254), phone = text(body.phone, 20);
  const plan = text(body.plan, 10) as Plan;
  if (!name || !isEmail(email) || !/^[0-9\- ]{10,13}$/.test(phone) || !(plan in PLANS)) return Response.json({ error: 'bad' }, { status: 400 });

  const key = process.env.RESEND_API_KEY, from = process.env.VIDEOKIT_MAIL_FROM;
  if (!key || !from) {
    console.error('[videokit] apply form received but mail is not configured (RESEND_API_KEY / VIDEOKIT_MAIL_FROM)');
    return Response.json({ error: 'off' }, { status: 503 });
  }
  const to = process.env.VIDEOKIT_APPLY_TO || 'sungchulkang@groundrooted.com';
  const at = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(Date.now());
  const rows: [string, string][] = [['이름', name], ['이메일', email], ['전화번호', phone], ['상품', PLANS[plan]], ['신청 시각', at]];

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
