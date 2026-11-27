// 토스페이먼츠 서버 API 호출은 모두 여기를 거친다 (결제 승인 · 결제 조회 · 주문번호 조회).
// 토스는 API 키를 '등록된 IP에서만' 쓸 수 있게 막을 수 있다. Vercel 함수는 고정 IP가 없어서,
// 막히면 {"code":"API_KEY_ACCESS_DENIED", "message":"... 요청 IP: x.x.x.x"} 가 돌아온다.
// 고정 IP 서버에 리버스 프록시를 두면 TOSS_API_BASE_URL에 그 주소를 넣는다(비우면 토스로 바로 호출).
// 프록시는 경로와 Authorization 헤더를 그대로 https://api.tosspayments.com 으로 넘기고,
// TOSS_API_PROXY_SECRET을 넣었다면 X-Proxy-Secret 헤더가 같은 요청만 받아야 한다.

const DIRECT = 'https://api.tosspayments.com';

export function tossBase() {
  const v = (process.env.TOSS_API_BASE_URL || '').trim().replace(/\/+$/, '');
  // 시크릿 키가 평문으로 나가지 않도록 https 주소만 쓴다. 잘못된 값이면 토스로 바로 호출한다.
  return /^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(v) ? v : DIRECT;
}

export type TossResult<T> = { ok: boolean; status: number; data: T & { code?: string; message?: string } };

// path는 '/v1/payments/...' 처럼 슬래시로 시작한다. body가 있으면 POST.
export async function tossRequest<T = Record<string, unknown>>(path: string, secretKey: string, body?: object): Promise<TossResult<T>> {
  const secret = process.env.TOSS_API_PROXY_SECRET;
  const res = await fetch(`${tossBase()}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...(secret && tossBase() !== DIRECT ? { 'X-Proxy-Secret': secret } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  }).catch(() => null);
  if (!res) return { ok: false, status: 0, data: { code: 'NETWORK_ERROR' } as TossResult<T>['data'] };
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

// 등록되지 않은 IP에서 불러서 막혔는지
export const ipDenied = (data: { code?: unknown } | null | undefined) => data?.code === 'API_KEY_ACCESS_DENIED';
// 오류 메시지에 적힌 요청 IP (판매자 알림용). 없으면 ''.
export const deniedIp = (message: unknown) =>
  (typeof message === 'string' && message.match(/(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7})/i)?.[1]) || '';
