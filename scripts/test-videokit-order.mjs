import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { checkOrder, makeOrderId, plans, isPlanId } from '../products/videokit.ts';

const kit = makeOrderId('kit', randomUUID());
const lesson = makeOrderId('lesson', randomUUID());
assert.deepEqual(checkOrder(kit, '300000'), { ok: true, plan: 'kit', amount: 300000 });
assert.deepEqual(checkOrder(lesson, 500000), { ok: true, plan: 'lesson', amount: 500000 });
// 금액 변조: 다른 상품 금액, 낮춘 금액, 소수, 빈 값
for (const [id, amt] of [[kit, 500000], [lesson, 300000], [kit, 1000], [kit, '300000.5'], [kit, ''], [kit, undefined]]) assert.equal(checkOrder(id, amt).ok, false, `${id} ${amt}`);
// 주문번호 변조
for (const id of ['vk-pro-' + randomUUID(), 'kit-' + randomUUID(), 'vk-kit-123', kit + 'x', undefined, 42]) assert.equal(checkOrder(id, 300000).ok, false, String(id));
assert.ok(isPlanId('kit') && isPlanId('lesson') && !isPlanId('toString') && !isPlanId(undefined));
assert.equal(plans.kit.amount, 300000); assert.equal(plans.lesson.amount, 500000);
console.log('PASS: videokit order/amount checks');
