import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { checkOrder, makeOrderId, plans, isPlanId, priceOf, nameOf, tierAt, SALE_ENDS, hasKit, hasLesson } from '../products/videokit.ts';
import { kitEmail, isEmail, deliverKit, deliveryConfigured } from '../products/videokit-delivery.ts';

const before = SALE_ENDS - 3600_000, after = SALE_ENDS + 3600_000;
assert.equal(tierAt(before), 's'); assert.equal(tierAt(after), 'r');
assert.equal(priceOf('kit', 's'), 100000); assert.equal(priceOf('lesson', 's'), 300000);
assert.equal(priceOf('kit', 'r'), 300000); assert.equal(priceOf('lesson', 'r'), 500000);

const kitS = makeOrderId('kit', 's', randomUUID());
const lessonS = makeOrderId('lesson', 's', randomUUID());
const kitR = makeOrderId('kit', 'r', randomUUID());
assert.deepEqual(checkOrder(kitS, '100000', before), { ok: true, plan: 'kit', tier: 's', amount: 100000 });
assert.deepEqual(checkOrder(lessonS, 300000, before), { ok: true, plan: 'lesson', tier: 's', amount: 300000 });
assert.deepEqual(checkOrder(kitR, 300000, after), { ok: true, plan: 'kit', tier: 'r', amount: 300000 });
// 할인가 주문: 마감 후 30분까지만
assert.equal(checkOrder(kitS, 100000, SALE_ENDS + 29 * 60_000).ok, true);
assert.equal(checkOrder(kitS, 100000, SALE_ENDS + 31 * 60_000).ok, false);
// 금액 변조: 다른 상품·다른 가격대 금액, 낮춘 금액, 소수, 빈 값
for (const [id, amt] of [[kitS, 300000], [kitS, 500000], [lessonS, 100000], [kitR, 100000], [kitS, 1000], [kitS, '100000.5'], [kitS, ''], [kitS, undefined]])
  assert.equal(checkOrder(id, amt, before).ok, false, `${id} ${amt}`);
// 주문번호 변조 (예전 형식 vk-kit-<uuid> 포함)
for (const id of ['vk-pro-s-' + randomUUID(), 'vk-kit-' + randomUUID(), 'vk-kit-x-' + randomUUID(), 'vk-kit-s-123', kitS + 'x', undefined, 42])
  assert.equal(checkOrder(id, 100000, before).ok, false, String(id));
assert.ok(isPlanId('kit') && isPlanId('lesson') && !isPlanId('toString') && !isPlanId(undefined));
assert.equal(plans.kit.sale, 100000); assert.equal(plans.lesson.regular, 500000);
// 강의권: 할인 기간에도 30만원, 키트 없음, 강의 있음
assert.equal(priceOf('pass', 's'), 300000); assert.equal(priceOf('pass', 'r'), 300000);
const passS = makeOrderId('pass', 's', randomUUID()), passR = makeOrderId('pass', 'r', randomUUID());
assert.deepEqual(checkOrder(passS, 300000, before), { ok: true, plan: 'pass', tier: 's', amount: 300000 });
assert.deepEqual(checkOrder(passR, 300000, after), { ok: true, plan: 'pass', tier: 'r', amount: 300000 });
assert.equal(checkOrder(passS, 100000, before).ok, false); assert.equal(checkOrder(passR, 200000, after).ok, false);
assert.ok(isPlanId('pass') && !hasKit('pass') && hasLesson('pass') && hasKit('kit') && !hasLesson('kit') && hasKit('lesson') && hasLesson('lesson'));
console.log('PASS: videokit order/amount checks');

// 키트 메일
assert.ok(isEmail('a.b@groundrooted.com') && !isEmail('a b@x.com') && !isEmail('<x>@y.com') && !isEmail('no-at') && !isEmail(undefined));
const m = kitEmail({ orderId: kitS, plan: 'lesson', itemName: nameOf('lesson', 's'), amount: 300000, name: '<b>홍길동</b>' }, { mac: 'https://x.supabase.co/sign?a=1&b=2', windows: 'https://x.supabase.co/win?c=3&d=4' }, SALE_ENDS);
assert.ok(m.html.includes('&lt;b&gt;홍길동&lt;/b&gt;') && !m.html.includes('<b>홍길동'), 'name escaped');
assert.ok(m.html.includes('href="https://x.supabase.co/sign?a=1&amp;b=2"'), 'link escaped');
assert.ok(m.html.includes('href="https://x.supabase.co/win?c=3&amp;d=4"') && m.text.includes('https://x.supabase.co/win?c=3&d=4'), 'windows link in mail');
assert.ok(m.html.includes('맥용 내려받기') && m.html.includes('윈도우용 내려받기') && !m.html.includes('전용입니다'), 'mac + windows buttons, no mac-only line');
assert.ok(m.html.includes('300,000원') && m.html.includes('1:1 강의 2회') && m.html.includes('강의 일정은 개별로') && m.text.includes('https://x.supabase.co/sign?a=1&b=2'));
assert.ok(nameOf('lesson', 'r').includes('3회 강의') && nameOf('lesson', 's').includes('2회'));
const k = kitEmail({ orderId: kitS, plan: 'kit', itemName: plans.kit.name, amount: 100000, name: '김' }, { mac: 'https://l', windows: 'https://w' }, SALE_ENDS);
assert.ok(!k.html.includes('강의 일정은 개별로'), 'kit mail has no lesson line');
assert.ok(k.html.includes('0. 클로드 비디오키트 사용설명서') && k.html.includes('INSTALL.md') && !k.html.includes('docs/manual') && k.text.includes('INSTALL.md'), 'kit mail matches kit layout');
assert.ok(k.html.includes('install.sh --check') && k.html.includes('install.ps1 -Check') && k.html.includes('C:\\Users\\&lt;이름&gt;\\Videos') && k.text.includes('시작하기 · 윈도우'), 'kit mail has mac and windows setup steps');
// 발송 설정이 없으면 아무것도 보내지 않고 off
for (const v of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'VIDEOKIT_MAIL_FROM']) delete process.env[v];
assert.equal(deliveryConfigured(), false);
assert.deepEqual(await deliverKit({ orderId: kitS, plan: 'kit', itemName: plans.kit.name, amount: 100000, email: 'a@b.co', name: '김' }), { status: 'off' });
assert.deepEqual(await deliverKit({ orderId: makeOrderId('pass', 's', randomUUID()), plan: 'pass', itemName: plans.pass.name, amount: 300000, email: 'a@b.co', name: '김' }), { status: 'none' });
console.log('PASS: videokit kit email');

// 가상계좌 입금 웹훅 판정
{
  const { depositReady } = await import('../products/videokit.ts');
  const id = makeOrderId('kit', 's', '123e4567-e89b-42d3-a456-426614174000');
  const pay = { status: 'DONE', orderId: id, totalAmount: 100000, secret: 'ps_abc', metadata: { email: 'a@b.co', name: '김' } };
  const body = { orderId: id, secret: 'ps_abc', status: 'DONE' };
  assert.equal(depositReady(body, pay).ok, true);                                       // 할인 마감 뒤 입금도 받는다
  assert.equal(depositReady({ ...body, secret: 'x' }, pay).ok, false);                    // secret 불일치
  assert.equal(depositReady({ ...body, secret: undefined }, { ...pay, secret: undefined }).ok, false);
  assert.equal(depositReady(body, { ...pay, status: 'WAITING_FOR_DEPOSIT' }).ok, false); // 아직 입금 전
  assert.equal(depositReady(body, { ...pay, totalAmount: 1000 }).ok, false);            // 금액 불일치
  assert.equal(depositReady({ ...body, orderId: 'other' }, pay).ok, false);              // 주문 불일치
  assert.equal(depositReady(body, null).ok, false);                                      // 조회 실패
  assert.equal(checkOrder(id, 100000, SALE_ENDS + 86400_000, { anyTime: true }).ok, true);
  console.log('PASS: videokit deposit webhook checks');
}

// 테스트 키 결제에는 키트 메일을 보내지 않는다 · 카드 결제 '심사 중' 안내
{
  const { kitMailAllowed, cardPending } = await import('../products/videokit.ts');
  for (const k of ['TOSS_CLIENT_KEY', 'TOSS_SECRET_KEY', 'TOSS_API_CLIENT_KEY', 'TOSS_API_SECRET_KEY', 'VIDEOKIT_CARD_PENDING']) delete process.env[k];
  assert.equal(kitMailAllowed(), false); assert.equal(cardPending(), true);           // 키 없음 = 문서 테스트 키
  process.env.TOSS_CLIENT_KEY = 'test_gck_x'; process.env.TOSS_SECRET_KEY = 'test_gsk_x';
  assert.equal(kitMailAllowed(), false); assert.equal(cardPending(), true);           // 테스트 키
  process.env.TOSS_CLIENT_KEY = 'live_gck_x'; process.env.TOSS_SECRET_KEY = 'live_gsk_x';
  assert.equal(kitMailAllowed(), true); assert.equal(cardPending(), false);           // 실제 키: 동작 그대로
  process.env.VIDEOKIT_CARD_PENDING = '1';
  assert.equal(kitMailAllowed(), true); assert.equal(cardPending(), true);            // 실제 키 + 심사 중 표시
  process.env.TOSS_API_CLIENT_KEY = 'test_ck_x'; process.env.TOSS_API_SECRET_KEY = 'test_sk_x';
  assert.equal(kitMailAllowed(), false);                                               // 결제창 키가 테스트면 메일 없음
  for (const k of ['TOSS_CLIENT_KEY', 'TOSS_SECRET_KEY', 'TOSS_API_CLIENT_KEY', 'TOSS_API_SECRET_KEY', 'VIDEOKIT_CARD_PENDING']) delete process.env[k];
  console.log('PASS: videokit test-mode kit mail guard');
}

// 영수증 요청 (판매자 메일 세 줄 — 운영봇이 읽는 형식)
{
  const { parseReceipt, receiptRows, formatPhone, formatBizNo } = await import('../products/videokit-receipt.ts');
  const { sellerNotice } = await import('../products/videokit-delivery.ts');
  const lines = (r) => receiptRows(r).map(([k, v]) => `${k}: ${v}`).join('\n');
  assert.equal(lines(parseReceipt(undefined, '홍길동')), '영수증: 필요 없음\n영수증 받는 분: -\n영수증 번호: -');
  assert.equal(lines(parseReceipt({ kind: 'none', to: 'x', no: 'y' }, '홍길동')), '영수증: 필요 없음\n영수증 받는 분: -\n영수증 번호: -');
  assert.equal(lines(parseReceipt({ kind: 'simple', to: '', no: '' }, '홍길동')), '영수증: 간이영수증\n영수증 받는 분: 홍길동\n영수증 번호: -');
  assert.equal(lines(parseReceipt({ kind: 'simple', to: '대영교회', no: '1234567890' }, '홍길동')), '영수증: 간이영수증\n영수증 받는 분: 대영교회\n영수증 번호: 123-45-67890');
  assert.equal(lines(parseReceipt({ kind: 'cash-income', no: '01012345678' }, '홍길동')), '영수증: 현금영수증(소득공제)\n영수증 받는 분: 홍길동\n영수증 번호: 010-1234-5678');
  assert.equal(lines(parseReceipt({ kind: 'cash-expense', to: '그라운드 단체', no: '000-00-00000' }, '홍길동')), '영수증: 현금영수증(지출증빙)\n영수증 받는 분: 그라운드 단체\n영수증 번호: 000-00-00000');
  // 형식 오류는 받지 않는다
  for (const r of [{ kind: 'bogus' }, { kind: 'simple', no: '12345' }, { kind: 'cash-income', no: '011-1234-5678' }, { kind: 'cash-income', no: '' },
    { kind: 'cash-expense', to: '단체', no: '123-45-6789' }, { kind: 'cash-expense', to: '', no: '1234567890' }])
    assert.equal(parseReceipt(r, '홍길동'), null, JSON.stringify(r));
  // 카드 · 간편결제는 현금영수증을 받지 않는다 (카드 매출전표)
  assert.equal(parseReceipt({ kind: 'cash-income', no: '01012345678' }, '김', { card: true }), null);
  assert.equal(parseReceipt({ kind: 'simple' }, '김', { card: true }).kind, 'simple');
  // 줄바꿈으로 가짜 줄을 끼워 넣지 못한다
  const inj = parseReceipt({ kind: 'cash-expense', to: '단체\n영수증 번호: 999-99-99999', no: '1234567890' }, '김');
  assert.equal(lines(inj).split('\n').length, 3); assert.ok(!lines(inj).includes('\n영수증 번호: 999'));
  assert.equal(formatPhone('010 1234 5678'), '010-1234-5678'); assert.equal(formatBizNo('123 45 67890'), '123-45-67890');
  // 카드 결제 판매자 알림: 제목은 [결제 완료], 본문에 같은 세 줄
  const n = sellerNotice({ orderId: kitS, plan: 'kit', amount: 100000, email: 'a@b.co', name: '홍길동' }, receiptRows(parseReceipt({ kind: 'simple' }, '홍길동')), '자동 발송함');
  assert.equal(n.subject, '[결제 완료] 키트 · 홍길동');
  assert.ok(n.text.includes('\n영수증: 간이영수증\n영수증 받는 분: 홍길동\n영수증 번호: -'));
  console.log('PASS: videokit receipt request');
}

// 토스 API 호출 한 곳 모음 · IP 차단(API_KEY_ACCESS_DENIED) 처리 · 프록시 주소
{
  const { tossBase, tossRequest, ipDenied, deniedIp } = await import('../products/toss.ts');
  const { tossBlockNotice } = await import('../products/videokit-delivery.ts');
  const { isOrderId } = await import('../products/videokit.ts');
  for (const k of ['TOSS_API_BASE_URL', 'TOSS_API_PROXY_SECRET']) delete process.env[k];
  assert.equal(tossBase(), 'https://api.tosspayments.com');
  process.env.TOSS_API_BASE_URL = 'https://toss-proxy.example.com/';
  assert.equal(tossBase(), 'https://toss-proxy.example.com');
  for (const bad of ['http://plain.example.com', 'toss-proxy.example.com', 'https://a b', ' ']) {
    process.env.TOSS_API_BASE_URL = bad; assert.equal(tossBase(), 'https://api.tosspayments.com', bad);   // https 아닌 주소는 무시
  }
  const denied = { code: 'API_KEY_ACCESS_DENIED', message: '허용되지 않은 IP입니다. 요청 IP: 34.201.144.237' };
  assert.ok(ipDenied(denied) && !ipDenied({ code: 'NOT_FOUND_PAYMENT' }) && !ipDenied(null) && !ipDenied(undefined));
  assert.equal(deniedIp(denied.message), '34.201.144.237');
  assert.equal(deniedIp('요청 IP: 2001:db8::1'), '2001:db8::1');
  assert.equal(deniedIp(undefined), ''); assert.equal(deniedIp('IP 없음'), '');
  // 실제 요청: 프록시 주소 · 인증 헤더 · 프록시 시크릿 헤더
  const realFetch = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, init) => { seen.push({ url, init }); return new Response(JSON.stringify(denied), { status: 403 }); };
  try {
    process.env.TOSS_API_BASE_URL = 'https://toss-proxy.example.com'; process.env.TOSS_API_PROXY_SECRET = 'px';
    const r = await tossRequest('/v1/payments/confirm', 'live_gsk_x', { paymentKey: 'k', orderId: 'o', amount: 1 });
    assert.equal(seen[0].url, 'https://toss-proxy.example.com/v1/payments/confirm');
    assert.equal(seen[0].init.method, 'POST');
    assert.equal(seen[0].init.headers.Authorization, `Basic ${Buffer.from('live_gsk_x:').toString('base64')}`);
    assert.equal(seen[0].init.headers['X-Proxy-Secret'], 'px');
    assert.ok(!r.ok && r.status === 403 && ipDenied(r.data));
    delete process.env.TOSS_API_BASE_URL;
    await tossRequest('/v1/payments/orders/x', 'live_gsk_x');
    assert.equal(seen[1].url, 'https://api.tosspayments.com/v1/payments/orders/x');
    assert.equal(seen[1].init.method, 'GET');
    assert.equal(seen[1].init.headers['X-Proxy-Secret'], undefined);                   // 토스에 바로 갈 때는 프록시 시크릿을 보내지 않는다
    globalThis.fetch = async () => { throw new Error('offline'); };
    const off = await tossRequest('/v1/payments/x', 'k');
    assert.ok(!off.ok && off.status === 0 && off.data.code === 'NETWORK_ERROR' && !ipDenied(off.data));
  } finally {
    globalThis.fetch = realFetch;
    for (const k of ['TOSS_API_BASE_URL', 'TOSS_API_PROXY_SECRET']) delete process.env[k];
  }
  // 판매자 알림: 제목 [결제 오류], 줄바꿈 끼워 넣기 방지
  const id = makeOrderId('kit', 's', '123e4567-e89b-42d3-a456-426614174000');
  const n = tossBlockNotice({ orderId: id, where: 'confirm', ip: '34.201.144.237' });
  assert.equal(n.subject, `[결제 오류] 토스 API IP 차단 · ${id}`);
  assert.ok(n.text.includes('돈은 빠져나가지 않았') && n.text.includes('토스가 본 요청 IP: 34.201.144.237'));
  assert.ok(tossBlockNotice({ orderId: id, where: 'webhook', ip: '' }).text.includes('알 수 없음'));
  assert.ok(isOrderId(id) && !isOrderId('vk-kit-' + randomUUID()) && !isOrderId(undefined));
  console.log('PASS: toss api ip-block handling');
}
