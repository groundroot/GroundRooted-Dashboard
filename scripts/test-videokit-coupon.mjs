// 할인 마감 뒤 쿠폰: 코드 · 사용 기간 · 주문번호 표식 · 금액을 서버 함수로 확인한다 (실제 결제 없음).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { checkOrder, couponWindow, makeCouponOrderId, makeOrderId, matchCoupon, priceOf, nameOf, isOrderId, SALE_ENDS } from '../products/videokit.ts';
import { sellerNotice } from '../products/videokit-delivery.ts';

const START = Date.parse('2026-12-02T00:00:00+09:00'), END = Date.parse('2026-12-10T00:00:00+09:00');
const during = START + 3600_000, before = START - 60_000, after = END + 60_000, afterGrace = END + 31 * 60_000;
const set = (codes, start = '2026-12-02T00:00:00+09:00', end = '2026-12-10T00:00:00+09:00') => {
  for (const [k, v] of [['VIDEOKIT_COUPON_CODES', codes], ['VIDEOKIT_COUPON_START', start], ['VIDEOKIT_COUPON_END', end]]) if (v == null) delete process.env[k]; else process.env[k] = v;
};

// 환경변수가 비면 어떤 코드도 맞지 않는다
set(undefined);
for (const c of ['', ' ', 'CHURCHMATE', undefined, 42]) assert.equal(matchCoupon(c), null, String(c));
assert.equal(makeCouponOrderId('kit', 'CHURCHMATE', randomUUID()), null);
set(' , ,');
assert.equal(matchCoupon(''), null); assert.equal(matchCoupon(','), null);

// 코드: 대소문자 · 앞뒤 공백 무관, 쉼표로 여러 개
set('ChurchMate, other2');
assert.equal(matchCoupon('churchmate'), 'CHURCHMATE'); assert.equal(matchCoupon('  CHURCHMATE '), 'CHURCHMATE'); assert.equal(matchCoupon('OTHER2'), 'OTHER2');
for (const c of ['CHURCHMAT', 'CHURCHMATEX', 'CHURCH MATE', 'churchmate,other2']) assert.equal(matchCoupon(c), null, c);

// 사용 기간: 시작 포함 · 끝 제외 (11/29~12/1, 12/10 이후는 밖)
assert.equal(couponWindow(Date.parse('2026-11-29T12:00:00+09:00')), 'before');
assert.equal(couponWindow(Date.parse('2026-12-01T23:59:59+09:00')), 'before');
assert.equal(couponWindow(START), 'open');
assert.equal(couponWindow(Date.parse('2026-12-09T23:59:59+09:00')), 'open');
assert.equal(couponWindow(END), 'after');
set('CHURCHMATE', 'not-a-date'); assert.equal(couponWindow(during), 'invalid');
set('CHURCHMATE', null, null); assert.equal(couponWindow(0), 'open');
set('ChurchMate, other2');

// 쿠폰가 = 지금 할인가와 같음 (키트 10만 · 키트 + 강의 30만), 강의권은 대상 아님
assert.equal(priceOf('kit', 'c'), 100000); assert.equal(priceOf('lesson', 'c'), 300000);
assert.equal(nameOf('lesson', 'c'), nameOf('lesson', 's'));
assert.equal(makeCouponOrderId('pass', 'CHURCHMATE', randomUUID()), null);
assert.equal(makeCouponOrderId('kit', 'WRONG', randomUUID()), null);

const kitC = makeCouponOrderId('kit', 'churchmate', randomUUID()), lessonC = makeCouponOrderId('lesson', 'other2', randomUUID());
assert.ok(isOrderId(kitC) && isOrderId(lessonC) && lessonC.length <= 64, 'coupon order id format ≤ 64');
assert.deepEqual(checkOrder(kitC, 100000, during), { ok: true, plan: 'kit', tier: 'c', amount: 100000, coupon: 'CHURCHMATE' });
assert.deepEqual(checkOrder(lessonC, '300000', during), { ok: true, plan: 'lesson', tier: 'c', amount: 300000, coupon: 'OTHER2' });
// 금액 변조 (정가 · 다른 금액) → 거절
for (const amt of [300000, 500000, 1000, 99999, '', undefined]) assert.equal(checkOrder(kitC, amt, during).ok, false, String(amt));
// 표식 위조: 다른 상품으로 바꾸기, 표식 바꾸기, 표식 없이 c, 강의권 c
const uuid = kitC.slice('vk-kit-c-'.length, -13), tag = kitC.slice(-12);
for (const id of [`vk-lesson-c-${uuid}-${tag}`, `vk-kit-c-${uuid}-000000000000`, `vk-kit-c-${uuid}`, `vk-pass-c-${uuid}-${tag}`, `vk-kit-c-${randomUUID()}-${tag}`, kitC.toUpperCase()])
  assert.equal(checkOrder(id, 100000, during).ok, false, id);
// 기간 밖 새 승인 거절 (끝난 뒤는 30분 유예), 웹훅(anyTime)은 기간 검사를 건너뛴다
assert.equal(checkOrder(kitC, 100000, before).ok, false, 'before window');
assert.equal(checkOrder(kitC, 100000, after).ok, true, 'grace 1 min after end');
assert.equal(checkOrder(kitC, 100000, afterGrace).ok, false, 'after grace');
assert.equal(checkOrder(kitC, 100000, afterGrace, { anyTime: true }).ok, true, 'webhook anyTime');
// 코드를 환경변수에서 지우면 그 코드의 주문은 승인되지 않는다
set('other2'); assert.equal(checkOrder(kitC, 100000, during).ok, false, 'revoked code'); assert.equal(checkOrder(lessonC, 300000, during).ok, true);
set(undefined); assert.equal(checkOrder(lessonC, 300000, during).ok, false, 'no codes');
// 일반 주문은 그대로: 마감 뒤 정가, 할인가 주문은 유예 뒤 거절
const kitR = makeOrderId('kit', 'r', randomUUID()), kitS = makeOrderId('kit', 's', randomUUID());
assert.equal(checkOrder(kitR, 300000, during).ok, true); assert.equal(checkOrder(kitR, 100000, during).ok, false);
assert.equal(checkOrder(kitS, 100000, SALE_ENDS + 31 * 60_000).ok, false);
assert.equal(checkOrder(kitS, 100000, SALE_ENDS - 1).coupon, null);

// 판매자 알림에 쿠폰 줄
const n = sellerNotice({ orderId: kitC, plan: 'kit', amount: 100000, email: 'a@b.co', name: '김', coupon: 'CHURCHMATE' }, [], '자동 발송함', during);
assert.ok(n.text.includes('쿠폰: 적용 · CHURCHMATE') && n.subject.includes('쿠폰'));
assert.ok(sellerNotice({ orderId: kitR, plan: 'kit', amount: 300000, email: 'a@b.co', name: '김' }, [], '-', during).text.includes('쿠폰: 없음'));
console.log('PASS: videokit coupon checks');
