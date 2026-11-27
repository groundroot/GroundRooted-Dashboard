// 결제가 승인되면 구매자 이메일로 키트 다운로드 링크와 업데이트용 구매자 키를 보낸다 (서버 전용).
// - 주문 내역은 자체 DB에 저장하지 않는다(토스 상점관리자에서 확인). 자체 DB에는 구매자 키(키 · 이메일 · 주문번호,
//   videokit_licenses)와 다운로드 링크(코드 · 이메일 · 이름 · 주문번호, 만료되면 지움, videokit_download_links)만 둔다. 같은 주문에 두 번 보내지 않는 것은
//   Resend의 Idempotency-Key(주문번호, 24시간 유지)로 막는다.
// - 키트 파일: 메일에는 짧은 다운로드 링크 https://groundrooted.com/d/<코드> 하나를 넣는다(7일 뒤 삭제, products/videokit-link.ts).
//   그 페이지의 맥용 · 윈도우용 버튼이 비공개 버킷의 파일(kit/current.json이 고름)에 주문번호 표식을 넣은 개인 zip으로 10분 서명 링크를 만든다.
// - 메일 발송: Resend API.
// 필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, VIDEOKIT_MAIL_FROM
// 선택: VIDEOKIT_BUCKET(videokit), VIDEOKIT_MAIL_REPLY_TO, VIDEOKIT_MAIL_BCC, VIDEOKIT_NOTICE_URL(공지 오픈카톡방 주소)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { issueLicense } from './videokit-license.ts';
import { createLink, kstDay, LINK_DAYS } from './videokit-link.ts';

type PlanId = 'kit' | 'lesson' | 'pass';

export { LINK_DAYS };

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

// 키트 zip 안의 구성 (dist/ClaudeVideoKit-*.zip 기준). 스킬 개수처럼 빌드마다 바뀌는 숫자는 적지 않는다.
const MANUAL_DIR = '0. Claude Video Kit Manual';
const CONTENTS = [
  '키트 파일: 영상 제작 스킬, 빌드 스크립트, 스타일 프리셋, 유튜브 학습 데이터, 설치 스크립트 (맥용 · 윈도우용)',
  `클로드 기반 사용 설명서: PDF · EPUB (zip 안 「${MANUAL_DIR}」 폴더, 윈도우용 zip에는 윈도우판 설명서)`,
];
const COPYRIGHT_NOTE = '※ 키트는 구매하신 분 본인만 쓸 수 있는 저작물입니다. 파일마다 주문번호가 들어 있어 유출 시 배포자를 확인할 수 있으며, 공유·재배포·재판매는 저작권법으로 금지됩니다.';
const KEY_NOTE = '키트에서 /videokit update를 처음 입력하면 이 키를 한 번 묻습니다. 본인만 쓰고 다른 사람과 나누지 마세요.';

// 메일 본문. 테스트에서 직접 부른다.
// link: 짧은 다운로드 링크(맥용 · 윈도우용을 그 페이지에서 고름). expiresAt: 링크가 삭제되는 시각.
// licenseKey: 키트의 /videokit update가 한 번 묻는 구매자 키. 발급하지 못했으면 빼고 보낸다.
export function kitEmail(o: Pick<Order, 'orderId' | 'plan' | 'itemName' | 'amount' | 'name'>, link: string, expiresAt: number, licenseKey?: string) {
  const item = o.itemName;
  const lesson = o.plan === 'lesson';
  const notice = env('VIDEOKIT_NOTICE_URL', '');
  const reply = env('VIDEOKIT_MAIL_REPLY_TO', 'sungchulkang@groundrooted.com');
  const subject = '[클로드 비디오 키트] 키트 다운로드 안내';
  // 맥과 윈도우는 옮길 폴더와 설치 점검 명령이 다르다 (각 zip의 INSTALL.md 기준).
  const guides = [
    { os: '맥', steps: [
      '맥용 zip을 더블클릭해 압축을 풀고, 나온 Claude Video Kit 폴더를 동영상 폴더(~/Movies)로 옮깁니다.',
      `폴더 맨 위의 「${MANUAL_DIR}」 폴더에 있는 사용 설명서(PDF 또는 EPUB)를 먼저 읽어 주세요. EPUB은 Apple Books 앱에서 열립니다.`,
      '같은 위치의 INSTALL.md를 따라 설치합니다. 설치 첫 단계(install.sh --check)를 꼭 실행해 주세요.',
    ] },
    { os: '윈도우', steps: [
      '윈도우용 zip의 압축을 풀고, 나온 Claude Video Kit 폴더를 동영상 폴더(C:\\Users\\<이름>\\Videos)로 옮깁니다.',
      `폴더 맨 위의 「${MANUAL_DIR}」 폴더에 있는 윈도우판 사용 설명서(PDF 또는 EPUB)를 먼저 읽어 주세요.`,
      '같은 위치의 INSTALL.md를 따라 설치합니다. 설치 첫 단계(install.ps1 -Check)를 꼭 실행해 주세요.',
    ] },
  ];
  const notes = [
    '이 키트는 Claude Pro 이상 요금제를 직접 구독해서 사용합니다. Claude 구독은 포함되어 있지 않습니다.',
    '맥(macOS, Apple Silicon)과 윈도우(Windows 10/11 64비트)를 지원합니다. 맥은 파이널컷 프로 · 캡컷, 윈도우는 캡컷 · 다빈치 리졸브 Studio(유료판)로 결과를 넘깁니다. 캡컷 · 다빈치 리졸브 연동은 베타입니다.',
    '키트는 구매자 본인의 영상 제작에 쓸 수 있으며, 다른 사람에게 복제·배포·판매·공유할 수 없습니다.',
  ];
  const linkNote = `다운로드 페이지에서 쓰시는 컴퓨터에 맞는 파일(맥용 · 윈도우용) 하나를 받으면 됩니다. 이 링크는 ${LINK_DAYS}일 뒤(${kstDay(expiresAt)}) 삭제됩니다. 그 뒤에 다시 받으시려면 이 메일에 답장해 주세요.`;
  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#f4f5f8;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;color:#1b1d22;word-break:keep-all">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:14px;padding:32px 28px">
<div style="font-size:12px;font-weight:700;letter-spacing:.06em;color:#e8622c">CLAUDE VIDEO KIT</div>
<h1 style="font-size:22px;line-height:1.4;margin:10px 0 18px">${esc(o.name)}님, 결제가 확인되었습니다</h1>
<p style="margin:0 0 6px;font-size:15px">${esc(item)}</p>
<p style="margin:0 0 22px;font-size:13px;color:#5d6270">결제 금액 ${won(o.amount)} · 주문번호 ${esc(o.orderId)}</p>
<a href="${esc(link)}" style="display:block;text-align:center;background:#e8622c;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:15px;border-radius:10px;margin:0 0 8px">키트 내려받기 (맥용 · 윈도우용)</a>
<p style="margin:0 0 6px;font-size:13px;text-align:center"><a href="${esc(link)}" style="color:#1b1d22">${esc(link)}</a></p>
<p style="margin:0 0 6px;font-size:12px;color:#5d6270;text-align:center">${esc(linkNote)}</p>
<p style="margin:0 0 24px;font-size:12px;color:#1b1d22;font-weight:600;text-align:center">${esc(COPYRIGHT_NOTE)}</p>
${licenseKey ? `<h2 style="font-size:15px;margin:0 0 8px">구매자 키 (업데이트용)</h2>
<p style="margin:0 0 6px;font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;letter-spacing:.04em;padding:12px 14px;background:#f4f5f8;border-radius:8px;text-align:center">${esc(licenseKey)}</p>
<p style="margin:0 0 24px;font-size:13px;color:#5d6270">${esc(KEY_NOTE)}</p>` : ''}
<h2 style="font-size:15px;margin:0 0 8px">들어 있는 것</h2>
<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7">
<li>${esc(CONTENTS[0])}</li>
<li>${esc(CONTENTS[1])}</li>
</ul>
${guides.map(g => `<h2 style="font-size:15px;margin:0 0 8px">시작하기 · ${g.os}</h2>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7">${g.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`).join('\n')}
${lesson ? `<p style="margin:0 0 20px;padding:12px 14px;background:#fdf0ea;border-radius:8px;font-size:14px">강의 일정은 개별로 조율합니다. 곧 연락드리겠습니다.</p>` : ''}
<ul style="margin:0 0 20px;padding-left:20px;font-size:13px;line-height:1.7;color:#5d6270">${notes.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
<p style="margin:0;font-size:14px;line-height:1.7">궁금한 점은 이 메일에 답장하거나 카카오톡 1:1 문의로 알려 주세요. 새 버전이 나오면 업데이트 파일을 이 메일 주소로 보내드리고, 공지는 ${notice ? `<a href="${esc(notice)}" style="color:#e8622c">오픈카톡방</a>` : '오픈카톡방'}에 올립니다. 후속지원은 구매일로부터 1년입니다.</p>
</div>
<p style="font-size:11px;color:#8a8f9c;line-height:1.6;margin:16px 4px 0">그라운드루티드 (GroundRooted) · 대표 강성철 · 사업자등록번호 543-09-03526 · ${esc(reply)}</p>
</div></body></html>`;
  const text = [
    `${o.name}님, 결제가 확인되었습니다.`, '', item, `결제 금액 ${won(o.amount)} · 주문번호 ${o.orderId}`, '',
    `키트 내려받기 (맥용 · 윈도우용): ${link}`, linkNote, COPYRIGHT_NOTE, '',
    ...(licenseKey ? [`구매자 키 (업데이트용): ${licenseKey}`, KEY_NOTE, ''] : []),
    '들어 있는 것', ...CONTENTS.map(s => `- ${s}`), '',
    ...guides.flatMap(g => [`시작하기 · ${g.os}`, ...g.steps.map((s, i) => `${i + 1}. ${s}`), '']),
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
  const sb = db();
  // 짧은 다운로드 링크: 같은 주문의 살아 있는 링크가 있으면 그것(새로고침 · 웹훅 재시도). force(재발송)면 새 링크.
  // 링크를 만들지 못하면 보낼 것이 없으므로 failed(결제 완료 화면이 카카오톡 안내, 판매자 알림에 '직접 보내야 함', 웹훅은 500으로 재시도).
  const link = await createLink(sb, { email: order.email, name: order.name, orderId: order.orderId, reuse: !force })
    .catch(e => { console.error('[videokit] download link failed', order.orderId, (e as Error).message); return null; });
  if (!link) return { status: 'failed', reason: 'download link' };
  // 구매자 키: 같은 주문이면 같은 키. 발급에 실패해도(테이블이 아직 없을 때 포함) 키트 메일은 키 없이 보낸다.
  const license = await issueLicense(sb, order.email, order.orderId).catch(e => { console.error('[videokit] license issue failed', order.orderId, (e as Error).message); return null; });
  const mail = kitEmail({ ...order, name: order.name.slice(0, 100) }, link.url, link.expiresAt, license?.key);
  const sent = await sendMail(order.email, mail, force ? `vk-mail-${order.orderId}-${Date.now()}` : `vk-mail-${order.orderId}`);
  if (!sent.ok) console.error('[videokit] kit mail failed', order.orderId, sent.reason);
  return sent.ok ? { status: 'sent', email: order.email } : { status: 'failed', reason: sent.reason };
}

// 카드 · 간편결제(실제 키) 승인 뒤 판매자에게 보내는 주문 알림. 계좌이체 주문 메일(/api/videokit/apply)과 같은 '라벨: 값' 본문에
// 영수증 세 줄을 넣는다. 제목은 '[결제 완료]'로 계좌이체의 '[구매 신청]'(입금 확인 대기)과 구분한다 — 결제가 끝났고 키트 메일은 자동으로 갔다.
// 같은 주문은 Resend 멱등 키로 24시간 안에 한 번만 간다. 받는 주소: VIDEOKIT_APPLY_TO(기본 sungchulkang@groundrooted.com).
const PLAN_MAIL: Record<PlanId, string> = { kit: '키트', lesson: '키트 + 1:1 강의', pass: '1:1 강의권 2회' };
export function sellerNotice(o: Pick<Order, 'orderId' | 'plan' | 'amount' | 'email' | 'name'>, receiptRows: [string, string][], kit: string, at = Date.now()) {
  const when = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(at);
  const rows: [string, string][] = [['이름', o.name], ['이메일', o.email], ['상품', PLAN_MAIL[o.plan]], ['금액', won(o.amount)], ['결제', '카드 · 간편결제(토스페이먼츠)'],
    ['주문번호', o.orderId], ['결제 시각', when], ['키트 메일', kit], ...receiptRows];
  const line = (s: string) => s.replace(/[\r\n]+/g, ' ');
  return {
    subject: `[결제 완료] ${PLAN_MAIL[o.plan]} · ${line(o.name)}`,
    text: rows.map(([k, v]) => `${k}: ${line(v)}`).join('\n'),
    html: `<table style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:15px;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>`,
  };
}
export async function notifySeller(o: Pick<Order, 'orderId' | 'plan' | 'amount' | 'email' | 'name'>, receiptRows: [string, string][], kit: string) {
  const key = env('RESEND_API_KEY'), from = env('VIDEOKIT_MAIL_FROM');
  if (!key || !from) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `vk-seller-${o.orderId}` },
    body: JSON.stringify({ from, to: [env('VIDEOKIT_APPLY_TO', 'sungchulkang@groundrooted.com')], ...(isEmail(o.email) ? { reply_to: o.email } : {}), ...sellerNotice(o, receiptRows, kit) }),
    cache: 'no-store',
  }).catch(() => null);
  if (!res?.ok) console.error('[videokit] seller notice failed', o.orderId, res?.status);
  return !!res?.ok;
}

// 토스 API가 IP 차단(API_KEY_ACCESS_DENIED)으로 막혔을 때 판매자에게 보내는 알림. 같은 주문 · 같은 단계는 24시간 안에 한 번만 간다.
// where: 'confirm'(결제 승인 — 승인되지 않아 돈은 빠져나가지 않음) · 'lookup'(결제 조회) · 'webhook'(가상계좌 입금 확인 — 토스가 다시 보냄)
export type TossBlock = { orderId: string; where: 'confirm' | 'lookup' | 'webhook'; ip: string };
const BLOCK_NOTE: Record<TossBlock['where'], string> = {
  confirm: '카드 · 간편결제 승인이 막혔습니다. 승인되지 않았으니 구매자 돈은 빠져나가지 않았고, 화면에서 계좌이체로 안내했습니다.',
  lookup: '이미 승인된 결제를 조회하지 못했습니다. 토스 상점관리자에서 이 주문을 확인하고 키트를 직접 보내 주세요.',
  webhook: '가상계좌 입금 알림을 받았지만 결제를 조회하지 못해 키트 메일을 보내지 못했습니다. 토스가 다시 보내지만, 상점관리자에서 입금을 확인하고 키트를 직접 보내 주세요.',
};
export function tossBlockNotice(b: TossBlock) {
  const rows: [string, string][] = [['상황', BLOCK_NOTE[b.where]], ['주문번호', b.orderId], ['토스가 본 요청 IP', b.ip || '알 수 없음'],
    ['할 일', '토스 개발자센터에서 API 키 허용 IP를 확인하세요 (website/toss-ip-allowlist.md).']];
  const line = (s: string) => s.replace(/[\r\n]+/g, ' ');
  return {
    subject: `[결제 오류] 토스 API IP 차단 · ${line(b.orderId)}`,
    text: rows.map(([k, v]) => `${k}: ${line(v)}`).join('\n'),
    html: `<table style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:15px;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>`,
  };
}
export async function alertTossBlocked(b: TossBlock) {
  console.error('[videokit] toss API_KEY_ACCESS_DENIED', b.where, b.orderId, b.ip);
  const key = env('RESEND_API_KEY'), from = env('VIDEOKIT_MAIL_FROM');
  if (!key || !from) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `vk-tossblock-${b.where}-${b.orderId}` },
    body: JSON.stringify({ from, to: [env('VIDEOKIT_APPLY_TO', 'sungchulkang@groundrooted.com')], ...tossBlockNotice(b) }),
    cache: 'no-store',
  }).catch(() => null);
  if (!res?.ok) console.error('[videokit] toss block alert failed', b.orderId, res?.status);
  return !!res?.ok;
}
