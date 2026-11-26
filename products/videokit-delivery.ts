// 결제가 승인되면 구매자 이메일로 키트 다운로드 링크를 보낸다 (서버 전용).
// - 주문·구매자 정보는 자체 DB에 저장하지 않는다(토스 상점관리자에서 확인). 같은 주문에 두 번 보내지 않는 것은
//   Resend의 Idempotency-Key(주문번호, 24시간 유지)로 막는다.
// - 키트 파일: Supabase Storage 비공개 버킷의 zip 하나(개인정보 없음). 메일에는 7일 동안 열리는 서명 링크를 넣는다.
// - 메일 발송: Resend API.
// 필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, VIDEOKIT_MAIL_FROM
// 선택: VIDEOKIT_BUCKET(videokit), VIDEOKIT_KIT_PATH(kit/claude-video-kit.zip), VIDEOKIT_MAIL_REPLY_TO, VIDEOKIT_MAIL_BCC, VIDEOKIT_NOTICE_URL(공지 오픈카톡방 주소)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type PlanId = 'kit' | 'lesson' | 'pass';

export const LINK_DAYS = 7;

export type Order = { orderId: string; plan: PlanId; itemName: string; amount: number; email: string; name: string; paymentKey?: string };
export type DeliveryResult =
  | { status: 'sent'; email: string }      // 보냄 (24시간 안에 같은 주문으로 다시 부르면 Resend가 새로 보내지 않음)
  | { status: 'off' }                      // 발송 설정이 아직 없음
  | { status: 'none' }                     // 보낼 키트가 없는 상품(강의권)
  | { status: 'failed'; reason: string };

const env = (k: string, d = '') => process.env[k] || d;
export const deliveryConfigured = () =>
  !!(env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY') && env('RESEND_API_KEY') && env('VIDEOKIT_MAIL_FROM'));

const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[^\s@<>"']{2,}$/;
export const isEmail = (v: unknown): v is string => typeof v === 'string' && v.length <= 254 && EMAIL.test(v);

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;
const kstDate = (ms: number) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(ms);

// 메일 본문. 테스트에서 직접 부른다.
export function kitEmail(o: Pick<Order, 'orderId' | 'plan' | 'itemName' | 'amount' | 'name'>, link: string, expiresAt: number) {
  const item = o.itemName;
  const lesson = o.plan === 'lesson';
  const notice = env('VIDEOKIT_NOTICE_URL', '');
  const reply = env('VIDEOKIT_MAIL_REPLY_TO', 'sungchulkang@groundrooted.com');
  const subject = '[클로드 비디오 키트] 키트 다운로드 안내';
  const steps = [
    '다운로드한 zip 파일을 더블클릭해 압축을 풉니다. 홈 폴더처럼 오래 둘 곳으로 옮겨 두세요.',
    '폴더 안 docs/manual 의 사용 설명서(PDF 또는 EPUB)를 엽니다. EPUB은 Apple Books 앱에서 열립니다.',
    '설명서 3부 "설치"를 따라 Claude Code와 키트를 설치합니다. 막히면 10장 "설치 오류 해결"을 보세요.',
  ];
  const notes = [
    '이 키트는 Claude Pro 이상 요금제를 직접 구독해서 사용합니다. Claude 구독은 포함되어 있지 않습니다.',
    'macOS(Apple Silicon) 전용입니다.',
    '키트는 구매자 본인의 영상 제작에 쓸 수 있으며, 다른 사람에게 복제·배포·판매·공유할 수 없습니다.',
  ];
  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#f4f5f8;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;color:#1b1d22;word-break:keep-all">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:14px;padding:32px 28px">
<div style="font-size:12px;font-weight:700;letter-spacing:.06em;color:#e8622c">CLAUDE VIDEO KIT · FOR FINAL CUT PRO</div>
<h1 style="font-size:22px;line-height:1.4;margin:10px 0 18px">${esc(o.name)}님, 결제가 확인되었습니다</h1>
<p style="margin:0 0 6px;font-size:15px">${esc(item)}</p>
<p style="margin:0 0 22px;font-size:13px;color:#5d6270">결제 금액 ${won(o.amount)} · 주문번호 ${esc(o.orderId)}</p>
<a href="${esc(link)}" style="display:block;text-align:center;background:#e8622c;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:15px;border-radius:10px">키트 내려받기 (zip)</a>
<p style="margin:10px 0 24px;font-size:12px;color:#5d6270;text-align:center">링크는 ${esc(kstDate(expiresAt))}까지 열립니다. 기간이 지나면 이 메일에 답장해 주시면 새 링크를 보내드립니다.</p>
<h2 style="font-size:15px;margin:0 0 8px">들어 있는 것</h2>
<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7">
<li>키트 파일: 스킬 29개, 빌드 스크립트, 스타일 프리셋, 유튜브 학습 데이터, 설치 스크립트</li>
<li>클로드 기반 사용 설명서: PDF · EPUB (zip 안 docs/manual)</li>
</ul>
<h2 style="font-size:15px;margin:0 0 8px">시작하기</h2>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
${lesson ? `<p style="margin:0 0 20px;padding:12px 14px;background:#fdf0ea;border-radius:8px;font-size:14px">강의 일정은 개별로 조율합니다. 곧 연락드리겠습니다.</p>` : ''}
<ul style="margin:0 0 20px;padding-left:20px;font-size:13px;line-height:1.7;color:#5d6270">${notes.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
<p style="margin:0;font-size:14px;line-height:1.7">궁금한 점은 이 메일에 답장하거나 카카오톡 1:1 문의로 알려 주세요. 새 버전이 나오면 업데이트 파일을 이 메일 주소로 보내드리고, 공지는 ${notice ? `<a href="${esc(notice)}" style="color:#e8622c">오픈카톡방</a>` : '오픈카톡방'}에 올립니다. 후속지원은 구매일로부터 1년입니다.</p>
</div>
<p style="font-size:11px;color:#8a8f9c;line-height:1.6;margin:16px 4px 0">그라운드루티드 (GroundRooted) · 대표 강성철 · 사업자등록번호 543-09-03526 · ${esc(reply)}</p>
</div></body></html>`;
  const text = [
    `${o.name}님, 결제가 확인되었습니다.`, '', item, `결제 금액 ${won(o.amount)} · 주문번호 ${o.orderId}`, '',
    `키트 내려받기 (zip): ${link}`, `링크는 ${kstDate(expiresAt)}까지 열립니다. 기간이 지나면 이 메일에 답장해 주세요.`, '',
    '들어 있는 것', '- 키트 파일: 스킬 29개, 빌드 스크립트, 스타일 프리셋, 유튜브 학습 데이터, 설치 스크립트', '- 클로드 기반 사용 설명서: PDF · EPUB (zip 안 docs/manual)', '',
    '시작하기', ...steps.map((s, i) => `${i + 1}. ${s}`), '',
    ...(lesson ? ['강의 일정은 개별로 조율합니다. 곧 연락드리겠습니다.', ''] : []),
    ...notes.map(s => `- ${s}`), '',
    `궁금한 점은 이 메일에 답장하거나 카카오톡 1:1 문의로 알려 주세요. 새 버전이 나오면 업데이트 파일을 이 메일 주소로 보내드리고, 공지는 오픈카톡방${notice ? `(${notice})` : ''}에 올립니다. 후속지원은 구매일로부터 1년입니다.`,
    '', `그라운드루티드 (GroundRooted) · ${reply}`,
  ].join('\n');
  return { subject, html, text };
}

function db(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

async function sendMail(to: string, mail: { subject: string; html: string; text: string }, idempotencyKey: string) {
  const bcc = env('VIDEOKIT_MAIL_BCC');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: env('VIDEOKIT_MAIL_FROM'), to: [to], reply_to: env('VIDEOKIT_MAIL_REPLY_TO', 'sungchulkang@groundrooted.com'), ...(bcc ? { bcc: [bcc] } : {}), ...mail }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true as const, id: String(data.id || '') } : { ok: false as const, reason: `resend ${res.status} ${data.message || ''}`.trim() };
}

// 결제 승인 직후 부른다. 결제 완료 화면을 새로고침해도 24시간 안에는 메일이 한 번만 간다.
// force: 판매자가 새 링크를 다시 보낼 때(scripts/videokit-resend.mjs).
export async function deliverKit(order: Order, { force = false } = {}): Promise<DeliveryResult> {
  if (order.plan === 'pass') return { status: 'none' };
  if (!deliveryConfigured()) return { status: 'off' };
  if (!isEmail(order.email)) { console.error('[videokit] no valid email in payment metadata', order.orderId); return { status: 'failed', reason: 'invalid email' }; }
  const bucket = env('VIDEOKIT_BUCKET', 'videokit');
  const path = env('VIDEOKIT_KIT_PATH', 'kit/claude-video-kit.zip');
  const signed = await db().storage.from(bucket).createSignedUrl(path, LINK_DAYS * 86400, { download: 'claude-video-kit.zip' });
  if (signed.error || !signed.data?.signedUrl) { console.error('[videokit] signed url failed', order.orderId, signed.error?.message); return { status: 'failed', reason: 'signed url' }; }
  const expiresAt = Date.now() + LINK_DAYS * 86400 * 1000;
  const mail = kitEmail({ ...order, name: order.name.slice(0, 100) }, signed.data.signedUrl, expiresAt);
  const sent = await sendMail(order.email, mail, force ? `vk-mail-${order.orderId}-${Date.now()}` : `vk-mail-${order.orderId}`);
  if (!sent.ok) console.error('[videokit] kit mail failed', order.orderId, sent.reason);
  return sent.ok ? { status: 'sent', email: order.email } : { status: 'failed', reason: sent.reason };
}
