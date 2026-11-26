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
const m = kitEmail({ orderId: kitS, plan: 'lesson', itemName: nameOf('lesson', 's'), amount: 300000, name: '<b>홍길동</b>' }, 'https://x.supabase.co/sign?a=1&b=2', SALE_ENDS);
assert.ok(m.html.includes('&lt;b&gt;홍길동&lt;/b&gt;') && !m.html.includes('<b>홍길동'), 'name escaped');
assert.ok(m.html.includes('href="https://x.supabase.co/sign?a=1&amp;b=2"'), 'link escaped');
assert.ok(m.html.includes('300,000원') && m.html.includes('1:1 강의 2회') && m.html.includes('강의 일정은 개별로') && m.text.includes('https://x.supabase.co/sign?a=1&b=2'));
assert.ok(nameOf('lesson', 'r').includes('3회 강의') && nameOf('lesson', 's').includes('2회'));
const k = kitEmail({ orderId: kitS, plan: 'kit', itemName: plans.kit.name, amount: 100000, name: '김' }, 'https://l', SALE_ENDS);
assert.ok(!k.html.includes('강의 일정은 개별로'), 'kit mail has no lesson line');
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
