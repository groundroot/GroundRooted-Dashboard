// 운영봇용: 구매자 키의 업데이트 기기 보기 · 리셋 · 추가 기기 반영 (계약 v2 §2.3, sql/videokit-devices.sql).
// 실행 (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY):
//   node scripts/videokit-devices.mjs list  <키|이메일|주문번호>
//   node scripts/videokit-devices.mjs reset <키|이메일|주문번호> [--reason "<문의 메일 요약>"] [--dry-run]
//       그 키의 기기 등록을 모두 지운다(횟수 제한 없음). reset_count + 1. 허용 대수 · 추가분은 그대로.
//   node scripts/videokit-devices.mjs add   <키|이메일|주문번호> <대수> [--order <주문번호>] [--note "<메모>"] [--dry-run]
//       추가 기기 반영(계좌이체 입금 확인 뒤 등). --order를 주면 같은 주문번호로 다시 실행해도 한 번만 들어간다.
// 출력: JSON 한 줄(키는 끝 4자만, 기기 값은 앞 8자만). 종료 코드: 0 성공, 2 키를 못 찾음 · 사용법 오류, 3 이메일에 키가 여러 개(reset · add), 1 DB 오류.
import { db } from '../products/videokit-license.ts';
import { addDevices, describeLicense, findLicenses, maskKey, resetDevices } from '../products/videokit-devices.ts';

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return ''; const v = argv[i + 1] ?? ''; argv.splice(i, 2); return v; };
const dryRun = argv.includes('--dry-run');
if (dryRun) argv.splice(argv.indexOf('--dry-run'), 1);
const reason = flag('--reason'), order = flag('--order'), note = flag('--note');
const [cmd, query, count] = argv;

const usage = (msg) => {
  if (msg) console.error(msg);
  console.error('사용법: node scripts/videokit-devices.mjs list <키|이메일|주문번호>\n      node scripts/videokit-devices.mjs reset <키|이메일|주문번호> [--reason "…"] [--dry-run]\n      node scripts/videokit-devices.mjs add <키|이메일|주문번호> <대수> [--order <주문번호>] [--note "…"] [--dry-run]\n      (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요)');
  process.exit(2);
};
if (!['list', 'reset', 'add'].includes(cmd) || !query) usage();
const n = Number(count);
if (cmd === 'add' && (!Number.isInteger(n) || n < 1 || n > 100)) usage('대수는 1~100 사이 정수여야 합니다.');
if (order && order.length > 64) usage('주문번호가 너무 깁니다.');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) usage();

const out = (o) => console.log(JSON.stringify(o));
try {
  const sb = db();
  const found = await findLicenses(sb, query);
  if (!found.length) { out({ error: 'not_found', query: query.includes('@') ? query : query.replace(/^(VK-).*(.{4})$/i, '$1…-$2') }); process.exit(2); }
  if (cmd === 'list') {
    out({ licenses: await Promise.all(found.map((l) => describeLicense(sb, l))) });
    process.exit(0);
  }
  // reset · add는 키 하나에만. 이메일에 키가 여러 개면 목록만 보이고 멈춘다.
  if (found.length > 1) { out({ error: 'multiple_keys', keys: found.map((l) => ({ key: maskKey(l.key), order_id: l.order_id, created_at: l.created_at })) }); process.exit(3); }
  const lic = found[0];
  if (cmd === 'reset') {
    const r = await resetDevices(sb, lic, { dryRun });
    out({ ...r, ...(reason ? { reason: reason.slice(0, 200) } : {}) });
  } else {
    const r = await addDevices(sb, lic, n, { orderId: order, note, dryRun });
    if (r.allowance_before === null) console.error('주의: 이 키는 대수 제한이 없습니다(device_limit NULL). 추가분은 기록되지만 효과가 없습니다.');
    out(r);
  }
  process.exit(0);
} catch (e) {
  out({ error: 'db', message: e.message });
  process.exit(1);
}
