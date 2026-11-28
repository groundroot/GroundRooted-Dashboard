// 키트 짧은 다운로드 링크 /d/<코드>. 네트워크 없이 돈다 (Supabase · Resend 호출은 가짜 fetch로 받는다).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  newCode, normalizeCode, CODE_PATTERN, linkUrl, expiryFor, kstDay, maskName, isCurrent, fileName,
  loadLink, handleDownload, downloadPage, resetLimits, createLink, revokeLink, supabaseLinkDeps, clientIp, ipBlocked, SIGN_SECONDS, DEFAULT_MAX_DOWNLOADS, markFor,
} from '../products/videokit-link.ts';
import { watermarkKit, buildZip, readZipFiles, LICENSE_PATH, TAGGED_SKILLS } from '../products/videokit-watermark.ts';
import { linkTag } from '../products/videokit-mark.ts';
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';
import { createHash } from 'node:crypto';
import { db } from '../products/videokit-license.ts';
import { deliverKit, kitEmail } from '../products/videokit-delivery.ts';
import { makeOrderId, plans } from '../products/videokit.ts';

// ---- 코드 · 날짜 · 이름 ----
{
  const codes = new Set();
  for (let i = 0; i < 2000; i++) { const c = newCode(); assert.match(c, CODE_PATTERN); assert.equal(c.length, 8); assert.ok(!/[01OIl]/.test(c), c); codes.add(c); }
  assert.equal(codes.size, 2000);
  assert.equal(normalizeCode('  abcd2345 '), 'ABCD2345');
  assert.ok(CODE_PATTERN.test('ABCD2345'));
  for (const c of ['ABCDEF', 'ABCD234', 'ABCD23456', 'ABCD234O', 'ABCD2340', 'ABCD2341', 'ABCD234I', 'abcd2345', 'ABCD-234', '']) assert.ok(!CODE_PATTERN.test(c), c);
  assert.equal(linkUrl('ABCD2345'), 'https://groundrooted.com/d/ABCD2345');
  // 2026-11-27 15:00 KST 발급 → 12월 4일 23:59:59 KST(= 14:59:59 UTC)에 만료
  const issued = Date.parse('2026-11-27T06:00:00Z');
  assert.equal(new Date(expiryFor(issued)).toISOString(), '2026-12-04T14:59:59.000Z');
  assert.equal(kstDay(expiryFor(issued)), '2026년 12월 4일');
  // 자정 직후(KST) 발급도 KST 날짜로 센다: 11-27 00:30 KST(= 11-26 15:30 UTC) → 12월 4일
  assert.equal(kstDay(expiryFor(Date.parse('2026-11-26T15:30:00Z'))), '2026년 12월 4일');
  assert.equal(kstDay(expiryFor(issued, 1)), '2026년 11월 28일');
  assert.equal(maskName('강성철 (시험)'), '강*철 (시험)');
  assert.equal(maskName('김철'), '김*'); assert.equal(maskName('남궁민수'), '남**수'); assert.equal(maskName('김'), '김');
  assert.equal(maskName(''), ''); assert.equal(maskName(null), ''); assert.equal(maskName('  Jane Doe '), 'J**e Doe');
  assert.equal(fileName('mac', '1.3'), 'ClaudeVideoKit-Mac-1.3.zip'); assert.equal(fileName('windows', '1.3'), 'ClaudeVideoKit-Windows-1.3.zip');
  console.log('PASS: link code, expiry date (KST), name mask');
}

// ---- 구매자 표식 (원본 zip → 개인 zip) ----
const sha = b => createHash('sha256').update(b).digest('hex');
const T = 'Claude Video Kit/';
const ROOT_MD = '# 키트\n본문\n', SYS_MD = '# System\n', SKILL = '---\nname: x\n---\n';
const KIT = buildZip([
  { name: `${T}CLAUDE.md`, content: ROOT_MD },
  { name: `${T}System/CLAUDE.md`, content: SYS_MD },
  { name: `${T}.claude/skills/x/SKILL.md`, content: SKILL },
  { name: `${T}System/MANIFEST.json`, content: `{\n"version": "1.3",\n"files": {\n"CLAUDE.md": {\n"sha256": "${sha(Buffer.from(ROOT_MD))}"\n},\n".claude/skills/x/SKILL.md": {\n"sha256": "${sha(Buffer.from(SKILL))}"\n},\n"System/CLAUDE.md": {\n"sha256": "${sha(Buffer.from(SYS_MD))}"\n}\n},\n"default_rules": {}\n}` },
]);
{
  const mark = { orderId: 'VK-KIT-20261127-AB12', issued: '2026-11-27', code: 'ABCD2345' };
  const { files, comment } = readZipFiles(await watermarkKit(KIT, mark));
  const line = 'Claude Video Kit · order VK-KIT-20261127-AB12 · issued 2026-11-27 · link ABCD2345';
  assert.equal(comment, line, 'zip comment');
  const lic = files.get(LICENSE_PATH).content.toString('utf8');
  assert.ok(lic.startsWith('\uFEFF') && lic.includes('이 키트는 주문번호 VK-KIT-20261127-AB12의 구매자 본인용입니다.') && lic.includes('유출되면 주문번호로 배포자를 확인합니다'), 'visible LICENSE.txt');
  assert.equal(files.get(LICENSE_PATH).externalAttr >>> 16, 0o100644);
  const m = JSON.parse(files.get(`${T}System/MANIFEST.json`).content);
  assert.deepEqual(m.license, { order: 'VK-KIT-20261127-AB12', issued: '2026-11-27', link: 'ABCD2345' });
  for (const [rel, orig] of [['CLAUDE.md', ROOT_MD], ['System/CLAUDE.md', SYS_MD]]) {
    const body = files.get(T + rel).content;
    assert.equal(body.toString(), `${orig}\n<!-- ${line} -->\n`, `${rel} comment`);
    assert.equal(m.files[rel].sha256, sha(body), `${rel} sha256 in MANIFEST follows the change (update.py sees it as untouched)`);
  }
  assert.equal(files.get(`${T}.claude/skills/x/SKILL.md`).content.toString(), SKILL, 'other files unchanged');
  assert.equal(m.files['.claude/skills/x/SKILL.md'].sha256, sha(Buffer.from(SKILL)));
  assert.equal(m.version, '1.3'); assert.deepEqual(m.default_rules, {});
  // 키트 구조가 아니면 표식 없이 내보내지 않는다(throw)
  await assert.rejects(watermarkKit(buildZip([{ name: `${T}CLAUDE.md`, content: 'x' }]), mark), /MANIFEST/);
  await assert.rejects(watermarkKit(Buffer.from('not a zip'), mark), /zip/);
  await assert.rejects(watermarkKit(await watermarkKit(KIT, mark), mark), /LICENSE/);
  // 주문번호 · 발급일: 없으면 TEST-<코드>, 이상한 글자는 _, 발급일은 created_at의 KST 날짜
  const base = { code: 'ABCD2345', email: 'a@b.co', name: null, expires_at: '', revoked: false, download_count: 0, max_downloads: 10 };
  assert.deepEqual(markFor({ ...base, order_id: 'VK-1', created_at: '2026-11-27T15:30:00Z' }, 0), { orderId: 'VK-1', issued: '2026-11-28', code: 'ABCD2345' });
  assert.equal(markFor({ ...base, order_id: null, created_at: null }, Date.parse('2026-11-27T06:00:00Z')).orderId, 'TEST-ABCD2345');
  assert.equal(markFor({ ...base, order_id: '  ', created_at: null }, 0).orderId, 'TEST-ABCD2345');
  assert.equal(markFor({ ...base, order_id: 'a --> <b>"', created_at: null }, 0).orderId, 'a_--___b__');
  const card = makeOrderId('kit', 's', randomUUID());
  assert.equal(markFor({ ...base, order_id: card, created_at: null }, 0).orderId, card, 'card order id is kept as is');
  assert.equal(markFor({ ...base, order_id: '계좌이체-홍길동-1127', created_at: null }, 0).orderId, '계좌이체-홍길동-1127', 'manual Korean order id is kept');
  console.log('PASS: buyer mark (LICENSE.txt, zip comment, MANIFEST license + sha, CLAUDE.md comments)');
}

// ---- 계약 v3 §5: 스킬 · 설명서 링크 태그 (VIDEOKIT_MARK_SECRET이 있을 때) ----
{
  const M = `${T}0. Claude Video Kit Manual/`;
  const pdfDoc = await PDFDocument.create();
  const f = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 3; i++) pdfDoc.addPage([400, 600]).drawText(`page ${i + 1}`, { x: 50, y: 500, size: 12, font: f });
  pdfDoc.setKeywords(['manual']);
  const PDF = Buffer.from(await pdfDoc.save());
  const OPF = '<?xml version="1.0"?>\n<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n<dc:identifier id="bookid">urn:uuid:1</dc:identifier>\n</metadata></package>\n';
  const EPUB = buildZip([{ name: 'mimetype', content: 'application/epub+zip' }, { name: 'META-INF/container.xml', content: '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>' },
    { name: 'OEBPS/content.opf', content: OPF }, { name: 'OEBPS/style.css', content: 'body{}' }, { name: 'OEBPS/b.css', content: 'p{}' }]);
  const SHORTS = '---\nname: shorts\n---\n본문\n';
  const parts = { 'CLAUDE.md': ROOT_MD, 'System/CLAUDE.md': SYS_MD, '.claude/skills/shorts/SKILL.md': SHORTS, '.claude/skills/x/SKILL.md': SKILL,
    '0. Claude Video Kit Manual/Claude-Video-Kit-Manual.pdf': PDF, '0. Claude Video Kit Manual/Claude-Video-Kit-Manual.epub': EPUB };
  const manifest = (over = {}) => `{\n"version": "1.4.2",\n"files": {\n${Object.entries({ ...Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, sha(Buffer.from(v))])), ...over })
    .map(([k, h]) => `"${k}": {\n"sha256": "${h}"\n}`).join(',\n')},\n"System/audio": {\n"link": "../Assets/Voices"\n}\n}\n}`;
  const kit = (m = manifest()) => buildZip([...Object.entries(parts).map(([k, v]) => ({ name: T + k, content: v })), { name: `${T}System/audio`, content: '../Assets/Voices' }, { name: `${T}System/MANIFEST.json`, content: m }]);
  const mark = { orderId: '계좌이체-홍길동-1127', issued: '2026-11-28', code: 'ABCD2345' };
  const tag = p => linkTag('TEST-MARK-SECRET', 'ABCD2345', p);
  const out = readZipFiles(await watermarkKit(kit(), mark, { linkTag: tag })).files;
  const m = JSON.parse(out.get(`${T}System/MANIFEST.json`).content);
  // 모든 표식 파일의 sha256 = MANIFEST (업데이트가 '고친 파일'로 보지 않음)
  for (const [rel, e] of Object.entries(m.files)) if (e.sha256) assert.equal(sha(out.get(T + rel).content), e.sha256, rel);
  assert.equal(out.get(`${T}.claude/skills/shorts/SKILL.md`).content.toString(), `${SHORTS}\n<!-- vk:${tag('.claude/skills/shorts/SKILL.md')} -->\n`);
  assert.equal(tag('.claude/skills/shorts/SKILL.md'), linkTag('TEST-MARK-SECRET', 'ABCD2345', '.claude/skills/shorts/SKILL.md'));
  assert.equal(out.get(`${T}.claude/skills/x/SKILL.md`).content.toString(), SKILL, 'skills outside the list are untouched');
  assert.equal(TAGGED_SKILLS.length, 10);
  // PDF: 쪽 수 그대로, Keywords에 vk:태그(기존 값 뒤에), XMP dc:identifier
  const pdfTag = tag('0. Claude Video Kit Manual/Claude-Video-Kit-Manual.pdf');
  const pdf = await PDFDocument.load(out.get(`${M}Claude-Video-Kit-Manual.pdf`).content);
  assert.equal(pdf.getPageCount(), 3); assert.equal(pdf.getKeywords(), `manual vk:${pdfTag}`);
  assert.match(Buffer.from(pdf.catalog.lookup(PDFName.of('Metadata')).contents).toString(), new RegExp(`<dc:identifier>vk:${pdfTag}</dc:identifier>`));
  // EPUB: mimetype 첫 항목 그대로, OPF identifier 하나 더(기존 것 유지), 첫 CSS 끝 주석
  const epubTag = tag('0. Claude Video Kit Manual/Claude-Video-Kit-Manual.epub');
  const epubBuf = out.get(`${M}Claude-Video-Kit-Manual.epub`).content, epub = readZipFiles(epubBuf).files;
  assert.equal([...epub.keys()][0], 'mimetype'); assert.deepEqual(epubBuf.subarray(0, 30 + 8), EPUB.subarray(0, 30 + 8), 'mimetype entry bytes unchanged');
  const opf = epub.get('OEBPS/content.opf').content.toString();
  assert.ok(opf.includes('<dc:identifier id="bookid">urn:uuid:1</dc:identifier>') && opf.includes(`<dc:identifier id="vk">vk:${epubTag}</dc:identifier>\n</metadata>`));
  assert.equal(epub.get('OEBPS/style.css').content.toString(), `body{}\n/* vk:${epubTag} 주문 계좌이체-홍길동-1127 */\n`);
  assert.equal(epub.get('OEBPS/b.css').content.toString(), 'p{}', 'only the first CSS');
  assert.equal(out.get(`${T}System/audio`).content.toString(), '../Assets/Voices', 'symlink entry kept');
  // 비밀이 없으면(linkTag 없음) 종전 표식만
  const plain = readZipFiles(await watermarkKit(kit(), mark)).files;
  assert.deepEqual(plain.get(`${M}Claude-Video-Kit-Manual.pdf`).content, PDF); assert.equal(plain.get(`${T}.claude/skills/shorts/SKILL.md`).content.toString(), SHORTS);
  // MANIFEST 해시가 zip 내용과 다르면(원본부터 틀림) 내보내지 않는다
  await assert.rejects(watermarkKit(kit(manifest({ '.claude/skills/x/SKILL.md': 'f'.repeat(64) })), mark, { linkTag: tag }), /does not match \.claude\/skills\/x\/SKILL\.md/);
  await assert.rejects(watermarkKit(kit(manifest({ 'System/gone.md': 'f'.repeat(64) })), mark), /does not match System\/gone\.md/);
  console.log('PASS: v3 §5 link tags — 10 skills, manual PDF (Keywords · XMP · page count), EPUB (OPF id · first CSS · mimetype), MANIFEST all hashes re-checked');
}

const CURRENT = { version: '1.3', mac: { path: 'kit/links/1.3/ClaudeVideoKit-Mac-1.3.zip' }, windows: { path: 'kit/links/1.3/ClaudeVideoKit-Windows-1.3.zip' } };
{
  assert.ok(isCurrent(CURRENT));
  for (const bad of [null, {}, { ...CURRENT, version: '1.3-beta' }, { ...CURRENT, version: '' }, { ...CURRENT, mac: undefined }, { ...CURRENT, windows: { path: 'releases/x.zip' } },
    { ...CURRENT, mac: { path: 'kit/../secret.zip' } }, { ...CURRENT, mac: { path: 'kit/links/1.3/x.json' } }, { ...CURRENT, mac: { path: 3 } }]) assert.equal(isCurrent(bad), false, JSON.stringify(bad));
  console.log('PASS: kit/current.json validation');
}

// ---- 페이지 · 버튼 (가짜 의존성) ----
const NOW = Date.parse('2026-11-27T06:00:00Z');
const GOOD = 'ABCD2345', OLD = 'QLDC2345', REVOKED = 'REVK2345', FULL = 'FULL2345';
const row = (code, over = {}) => ({ code, email: 'a@b.co', name: '강성철 (시험)', order_id: 'TEST-LINK-1', expires_at: new Date(expiryFor(NOW)).toISOString(), revoked: false, download_count: 0, max_downloads: 10, ...over });
function fake(over = {}) {
  const calls = { find: [], remove: [], hit: [], sign: [], put: [] };
  const rows = { [GOOD]: row(GOOD), [OLD]: row(OLD, { expires_at: new Date(NOW - 1000).toISOString() }), [REVOKED]: row(REVOKED, { revoked: true }), [FULL]: row(FULL, { download_count: 10 }) };
  const deps = {
    find: async c => { calls.find.push(c); return rows[c] ?? null; },
    remove: async c => { calls.remove.push(c); },
    hit: async (c, n) => { calls.hit.push([c, n]); },
    readCurrent: async () => CURRENT,
    sign: async (p, s, d) => { calls.sign.push([p, s, d]); return `https://x.supabase.co/storage/v1/object/sign/videokit/${p}?token=t&download=${d}`; },
    readKit: async p => { assert.ok(p.startsWith('kit/links/1.3/')); return KIT; },
    putPersonal: async (p, b) => { calls.put.push([p, b]); },
    markSecret: 'TEST-MARK-SECRET',
    now: NOW,
    ...over,
  };
  return { deps, calls };
}

{
  let { deps, calls } = fake();
  assert.deepEqual(await loadLink('abcd2345', deps), { status: 'ok', code: GOOD, name: '강*철 (시험)', version: '1.3', expiresAt: expiryFor(NOW) });
  assert.equal(calls.sign.length, 0, 'page view does not sign'); assert.equal(calls.hit.length, 0, 'page view is not counted');
  // 만료 → gone + 행 삭제
  ({ deps, calls } = fake());
  assert.deepEqual(await loadLink(OLD, deps), { status: 'gone' }); assert.deepEqual(calls.remove, [OLD]);
  // 없음 · 막힘 → gone
  for (const c of ['ZZZZ2345', REVOKED]) { ({ deps } = fake()); assert.deepEqual(await loadLink(c, deps), { status: 'gone' }, c); }
  // 형식이 틀린 코드는 DB까지 가지 않는다
  ({ deps, calls } = fake());
  for (const c of ['', 'x', '0000OOOO', '../etc', 42, undefined]) assert.deepEqual(await loadLink(c, deps), { status: 'gone' });
  assert.equal(calls.find.length, 0);
  // DB 오류 · current.json 없음/형식 틀림은 '만료'가 아니라 unavailable
  const quiet = console.error; console.error = () => {};
  try {
    ({ deps } = fake({ find: async () => { throw new Error('relation does not exist'); } })); assert.deepEqual(await loadLink(GOOD, deps), { status: 'unavailable' });
    ({ deps } = fake({ readCurrent: async () => { throw new Error('not found'); } })); assert.deepEqual(await loadLink(GOOD, deps), { status: 'unavailable' });
    ({ deps } = fake({ readCurrent: async () => ({ version: '1.3' }) })); assert.deepEqual(await loadLink(GOOD, deps), { status: 'unavailable' });
  } finally { console.error = quiet; }
  console.log('PASS: page (ok, expired, missing, revoked, bad code, db error)');
}

let clock = NOW;
const dl = async (code, platform, over) => { const f = fake(over); f.deps.now = (clock += 61_000); const r = await handleDownload(code, platform, f.deps); return { r, ...f }; };
{
  resetLimits();
  // 정상: 표식을 넣은 개인 zip(kit/personal/<코드>/)을 올리고 그 10분 서명 링크로 303, 파일 이름 ClaudeVideoKit-Mac-1.3.zip, 횟수 +1
  let { r, calls } = await dl('abcd2345', 'mac');
  assert.equal(r.status, 303); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('location'), 'https://x.supabase.co/storage/v1/object/sign/videokit/kit/personal/ABCD2345/ClaudeVideoKit-Mac-1.3.zip?token=t&download=ClaudeVideoKit-Mac-1.3.zip');
  assert.deepEqual(calls.sign, [['kit/personal/ABCD2345/ClaudeVideoKit-Mac-1.3.zip', 600, 'ClaudeVideoKit-Mac-1.3.zip']]); assert.equal(SIGN_SECONDS, 600);
  assert.equal(calls.put.length, 1); assert.equal(calls.put[0][0], 'kit/personal/ABCD2345/ClaudeVideoKit-Mac-1.3.zip');
  assert.ok(readZipFiles(calls.put[0][1]).comment.includes('order TEST-LINK-1'), 'uploaded zip carries the order id');
  assert.deepEqual(calls.hit, [[GOOD, 1]]);
  ({ r, calls } = await dl(GOOD, 'windows'));
  assert.equal(r.status, 303); assert.deepEqual(calls.sign, [['kit/personal/ABCD2345/ClaudeVideoKit-Windows-1.3.zip', 600, 'ClaudeVideoKit-Windows-1.3.zip']]);
  // current.json의 sha256과 원본이 같으면 그대로, 다르면 503
  ({ r } = await dl(GOOD, 'mac', { readCurrent: async () => ({ ...CURRENT, mac: { ...CURRENT.mac, sha256: sha(KIT).toUpperCase() } }) })); assert.equal(r.status, 303);
  // 만료 · 없음 · 막힘 · 틀린 OS · 틀린 코드 → 페이지로 303 ("링크가 만료되었습니다"), 서명 · 기록 없음
  for (const [code, platform] of [[OLD, 'mac'], ['ZZZZ2345', 'mac'], [REVOKED, 'windows'], [GOOD, 'linux'], [GOOD, 'MAC'], ['0000OOOO', 'mac']]) {
    ({ r, calls } = await dl(code, platform));
    assert.equal(r.status, 303, `${code} ${platform}`); assert.equal(r.headers.get('location'), `/d/${normalizeCode(code)}`);
    assert.equal(calls.sign.length, 0); assert.equal(calls.hit.length, 0); assert.equal(calls.put.length, 0);
  }
  ({ calls } = await dl(OLD, 'mac')); assert.deepEqual(calls.remove, [OLD], 'expired link is deleted');
  // 링크당 횟수 상한(기본 10, max_downloads): 10번째까지 받고 넘으면 429 "다운로드 횟수를 넘었습니다" (서명하지 않음)
  assert.equal(DEFAULT_MAX_DOWNLOADS, 10);
  ({ r, calls } = await dl(FULL, 'mac'));
  assert.equal(r.status, 429); assert.match(await r.text(), /다운로드 횟수를 넘었습니다.*메일에 답장하거나 카카오톡/); assert.equal(calls.sign.length, 0); assert.equal(calls.hit.length, 0);
  ({ r, calls } = await dl(FULL, 'mac', { find: async () => row(FULL, { download_count: 9 }) }));
  assert.equal(r.status, 303); assert.deepEqual(calls.hit, [[FULL, 10]], '10th download is allowed');
  ({ r } = await dl(FULL, 'mac', { find: async () => row(FULL, { download_count: 10, max_downloads: 25 }) }));
  assert.equal(r.status, 303, 'custom --max is respected');
  // DB 오류 · current.json 문제 · 서명 실패 → 503, 횟수는 올리지 않음
  const quiet = console.error; console.error = () => {};
  try {
    for (const over of [{ find: async () => { throw new Error('db'); } }, { readCurrent: async () => { throw new Error('missing'); } }, { readCurrent: async () => ({ ...CURRENT, version: 'v 1' }) }, { sign: async () => null }, { sign: async () => { throw new Error('x'); } },
      // 표식을 넣지 못하면 원본을 내주지 않는다: 원본 읽기 실패 · 키트가 아닌 zip · sha256 불일치 · 업로드 실패
      { readKit: async () => { throw new Error('missing'); } }, { readKit: async () => buildZip([{ name: 'x.txt', content: 'x' }]) },
      { readCurrent: async () => ({ ...CURRENT, mac: { ...CURRENT.mac, sha256: 'f'.repeat(64) } }) }, { putPersonal: async () => { throw new Error('quota'); } }]) {
      ({ r, calls } = await dl(GOOD, 'mac', over));
      assert.equal(r.status, 503); assert.match(r.headers.get('content-type'), /text\/html/); assert.equal(calls.hit.length, 0);
      assert.ok(!calls.sign.some(([p]) => p.startsWith('kit/links/')), 'never signs the unmarked original');
    }
    // 기록 실패는 다운로드를 막지 않는다
    ({ r } = await dl(GOOD, 'mac', { hit: async () => { throw new Error('x'); } })); assert.equal(r.status, 303);
  } finally { console.error = quiet; }
  // GET /d/<코드>/<os>(메일 검사기 · 미리보기가 주소를 따라감)는 세지 않고 페이지로 돌려보낸다. DB에도 가지 않는다.
  { const g = downloadPage('abcd2345'); assert.equal(g.status, 303); assert.equal(g.headers.get('location'), `/d/${GOOD}`); assert.equal(g.headers.get('cache-control'), 'no-store'); }
  console.log('PASS: download button (ok, expired, missing, revoked, platform, cap, errors, GET not counted)');
}

// ---- 요청 수 제한: 링크 하나당 1분에 10번 ----
{
  resetLimits();
  const { deps, calls } = fake();
  const at = async (now, code = GOOD) => { deps.now = now; return handleDownload(code, 'mac', deps); };
  for (let i = 0; i < 10; i++) assert.equal((await at(NOW + i * 1000)).status, 303, `req ${i + 1}`);
  const r = await at(NOW + 10_000);
  assert.equal(r.status, 429); assert.equal(r.headers.get('retry-after'), '60'); assert.match(await r.text(), /요청이 너무 많습니다/);
  assert.equal(calls.find.length, 10, 'limited request does not hit the DB');
  { const other = await at(NOW + 10_000, 'ZZZZ2345'); assert.equal(other.status, 303, 'other codes are counted separately'); assert.equal(other.headers.get('location'), '/d/ZZZZ2345'); }
  assert.equal((await at(NOW + 61_000)).status, 303, 'window slides after a minute');
  console.log('PASS: download rate limit');
}

// ---- 코드 추측 막기: 한 IP가 10분에 없는 · 만료 코드를 10번 요청하면 그 IP의 /d/* 요청을 막는다 ----
{
  resetLimits();
  const { deps, calls } = fake();
  const IP = '203.0.113.7', OTHER = '198.51.100.9';
  // 추측: 없는 코드 · 형식이 틀린 코드 · 만료 코드를 섞어 10번
  const guesses = ['ZZZZ2345', 'ZZZZ2346', '0000OOOO', OLD, 'ZZZZ2347', REVOKED, 'ZZZZ2348', 'ZZZZ2349', 'ZZZZ234A', 'ZZZZ234B'];
  for (const [i, g] of guesses.entries()) {
    deps.now = NOW + i * 1000;
    const r = i % 2 ? await handleDownload(g, 'mac', deps, IP) : await loadLink(g, deps, IP);
    assert.equal(r.status, i % 2 ? 303 : 'gone', `guess ${i + 1}`);
  }
  assert.equal(ipBlocked(IP, NOW + 10_000), true);
  const before = calls.find.length;
  deps.now = NOW + 11_000;
  // 막힌 뒤에는 맞는 코드도 DB에 가지 않고 막힌다 (페이지 'limited', 버튼 429)
  assert.deepEqual(await loadLink(GOOD, deps, IP), { status: 'limited' });
  const blocked = await handleDownload(GOOD, 'mac', deps, IP);
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '600'); assert.equal(blocked.headers.get('cache-control'), 'no-store');
  assert.equal(calls.find.length, before, 'blocked IP does not reach the DB');
  // 다른 IP · 맞는 코드는 그대로
  assert.equal((await handleDownload(GOOD, 'mac', deps, OTHER)).status, 303);
  // 맞는 코드 요청은 실패로 세지 않는다
  for (let i = 0; i < 9; i++) { deps.now = NOW + 20_000 + i * 1000; assert.equal((await loadLink(GOOD, deps, OTHER)).status, 'ok'); }
  assert.equal(ipBlocked(OTHER, deps.now), false);
  // 10분이 지나면 풀린다
  deps.now = NOW + 9 * 1000 + 10 * 60_000;
  assert.equal((await loadLink(GOOD, deps, IP)).status, 'ok');
  // IP는 x-real-ip, 없으면 x-forwarded-for의 첫 값
  assert.equal(clientIp(new Headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' })), '203.0.113.7');
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.8, 10.0.0.1' })), '203.0.113.8');
  assert.equal(clientIp(new Headers()), undefined);
  console.log('PASS: code guessing is blocked per IP (10 misses / 10 min)');
}

// ---- 가짜 Supabase · Resend (실제 supabase-js가 만드는 요청을 받는다) ----
function filter(url, rows) {
  let out = rows;
  for (const [k, v] of url.searchParams) {
    if (['select', 'order', 'limit', 'columns'].includes(k)) continue;
    const i = v.indexOf('.'); const op = v.slice(0, i), val = v.slice(i + 1);
    out = out.filter(r => { const x = String(r[k]); return op === 'eq' ? x === val : op === 'lt' ? x < val : op === 'lte' ? x <= val : op === 'gt' ? x > val : true; });
  }
  const order = url.searchParams.get('order');
  if (order) { const [col, dir] = order.split('.'); out = [...out].sort((a, b) => (a[col] < b[col] ? -1 : 1) * (dir === 'desc' ? -1 : 1)); }
  const limit = url.searchParams.get('limit');
  return limit ? out.slice(0, Number(limit)) : out;
}
function fakeBackend({ linksMissing = false } = {}) {
  const tables = { videokit_licenses: [], videokit_download_links: [] }, mails = [], log = [], objects = new Map();
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method || 'GET').toUpperCase();
    log.push(`${method} ${url.pathname}${url.search}`);
    const ok = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.hostname === 'api.resend.com') { mails.push(JSON.parse(init.body)); return ok({ id: 'm1' }); }
    if (url.pathname.startsWith('/storage/v1/object/sign/')) return ok({ signedURL: `/object/sign/${url.pathname.split('/object/sign/')[1]}?token=t` });
    if (url.pathname === '/storage/v1/object/videokit/kit/current.json') return new Response(JSON.stringify(CURRENT), { status: 200 });
    if (method === 'GET' && url.pathname.startsWith('/storage/v1/object/videokit/kit/links/')) return new Response(KIT, { status: 200 });
    if (method === 'POST' && url.pathname.startsWith('/storage/v1/object/videokit/kit/personal/')) {
      const key = decodeURIComponent(url.pathname.replace('/storage/v1/object/videokit/', ''));
      objects.set(key, Buffer.from(await new Response(init.body).arrayBuffer())); return ok({ Key: `videokit/${key}` });
    }
    if (method === 'POST' && url.pathname === '/storage/v1/object/list/videokit') {
      const { prefix } = JSON.parse(init.body);
      return ok([...objects.keys()].filter(k => k.startsWith(`${prefix}/`)).map(k => ({ name: k.slice(prefix.length + 1) })));
    }
    if (method === 'DELETE' && url.pathname === '/storage/v1/object/videokit') {
      const { prefixes } = JSON.parse(init.body); prefixes.forEach(k => objects.delete(k)); return ok(prefixes.map(name => ({ name })));
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (table in tables) {
      if (table === 'videokit_download_links' && linksMissing) return ok({ code: '42P01', message: 'relation "videokit_download_links" does not exist' }, 404);
      const rows = tables[table];
      if (method === 'GET') return ok(filter(url, rows));
      if (method === 'POST') {
        const r = JSON.parse(init.body);
        const pk = table === 'videokit_licenses' ? 'key' : 'code';
        if (rows.some(x => x[pk] === r[pk] || (table === 'videokit_licenses' && x.order_id === r.order_id))) return ok({ code: '23505', message: 'duplicate key' }, 409);
        rows.push(table === 'videokit_licenses' ? { revoked: false, ...r } : { created_at: new Date().toISOString(), revoked: false, download_count: 0, max_downloads: 10, last_download_at: null, ...r });
        return new Response(null, { status: 201 });
      }
      if (method === 'PATCH') { const patch = JSON.parse(init.body); const hit = filter(url, rows); hit.forEach(r => Object.assign(r, patch)); return url.searchParams.has('select') ? ok(hit) : new Response(null, { status: 204 }); }
      if (method === 'DELETE') { const gone = new Set(filter(url, rows)); tables[table] = rows.filter(r => !gone.has(r)); return url.searchParams.has('select') ? ok([...gone]) : new Response(null, { status: 204 }); }
    }
    return ok({ message: `unexpected ${method} ${url.pathname}` }, 500);
  };
  return { tables, mails, log, objects };
}
Object.assign(process.env, { SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test', RESEND_API_KEY: 're_test', VIDEOKIT_MAIL_FROM: 'kit@groundrooted.com' });

// 발급: 새 링크 · 같은 주문 재사용(reuse) · 만료 행 정리 · 그리고 운영용 의존성으로 페이지 → 버튼 끝까지
{
  const be = fakeBackend();
  const sb = db();
  be.tables.videokit_download_links.push(row('OLDA2345', { expires_at: new Date(Date.now() - 1000).toISOString() }));
  const a = await createLink(sb, { email: 'christvictory@gmail.com', name: '강성철 (시험)', orderId: 'TEST-LINK-1' });
  assert.equal(be.tables.videokit_download_links.find(r => r.code === a.code).max_downloads, 10);
  assert.ok(a.created && CODE_PATTERN.test(a.code)); assert.equal(a.url, `https://groundrooted.com/d/${a.code}`);
  assert.ok(!be.tables.videokit_download_links.some(r => r.code === 'OLDA2345'), 'expired rows are cleaned up on issue');
  const stored = be.tables.videokit_download_links.find(r => r.code === a.code);
  assert.deepEqual({ email: stored.email, name: stored.name, order_id: stored.order_id }, { email: 'christvictory@gmail.com', name: '강성철 (시험)', order_id: 'TEST-LINK-1' });
  assert.equal(Date.parse(stored.expires_at), a.expiresAt); assert.equal(a.expiresAt, expiryFor(Date.now()));
  assert.deepEqual(await createLink(sb, { email: 'christvictory@gmail.com', orderId: 'TEST-LINK-1', reuse: true }), { ...a, created: false });
  const b = await createLink(sb, { email: 'christvictory@gmail.com', orderId: 'TEST-LINK-1' });
  assert.ok(b.created && b.code !== a.code, 'without reuse a new link is made');
  assert.equal(kstDay((await createLink(sb, { email: 'x@y.co', days: 1 })).expiresAt), kstDay(expiryFor(Date.now(), 1)));
  const many = await createLink(sb, { email: 'x@y.co', maxDownloads: 25 });
  assert.equal(be.tables.videokit_download_links.find(r => r.code === many.code).max_downloads, 25);
  // 관리자 끄기 (--revoke): 바로 막힌다
  assert.equal(await revokeLink(sb, many.code.toLowerCase()), true);
  assert.equal(be.tables.videokit_download_links.find(r => r.code === many.code).revoked, true);
  assert.deepEqual(await loadLink(many.code, supabaseLinkDeps(sb)), { status: 'gone' });
  assert.equal(await revokeLink(sb, 'ZZZZ2345'), false); assert.equal(await revokeLink(sb, 'nope'), false);

  resetLimits();
  const deps = supabaseLinkDeps(sb);
  const view = await loadLink(a.code, deps);
  assert.equal(view.status, 'ok'); assert.equal(view.name, '강*철 (시험)'); assert.equal(view.version, '1.3');
  const r = await handleDownload(a.code, 'windows', deps);
  assert.equal(r.status, 303);
  const personal = `kit/personal/${a.code}/ClaudeVideoKit-Windows-1.3.zip`;
  assert.equal(r.headers.get('location'), `https://fake.supabase.co/storage/v1/object/sign/videokit/${personal}?token=t&download=ClaudeVideoKit-Windows-1.3.zip`);
  assert.equal(JSON.parse(readZipFiles(be.objects.get(personal)).files.get(`${T}System/MANIFEST.json`).content).license.order, 'TEST-LINK-1', 'personal zip in the bucket');
  const hit = be.tables.videokit_download_links.find(x => x.code === a.code);
  assert.equal(hit.download_count, 1); assert.ok(Date.now() - Date.parse(hit.last_download_at) < 5000);
  // 만료된 링크로 요청이 오면 그 행을 지우고 페이지로 보낸다
  hit.expires_at = new Date(Date.now() - 1).toISOString();
  { const gone = await handleDownload(a.code, 'mac', deps); assert.equal(gone.status, 303); assert.equal(gone.headers.get('location'), `/d/${a.code}`); }
  assert.ok(!be.tables.videokit_download_links.some(x => x.code === a.code));
  assert.ok(!be.objects.has(personal), 'personal zip is deleted with the expired link');
  assert.deepEqual(await loadLink(a.code, deps), { status: 'gone' });
  // 끄기(--revoke) · 발급 때 만료 정리도 개인 zip을 지운다
  const c2 = await createLink(sb, { email: 'x@y.co', orderId: 'VK-2' });
  assert.equal((await handleDownload(c2.code, 'mac', deps)).status, 303);
  assert.ok(be.objects.has(`kit/personal/${c2.code}/ClaudeVideoKit-Mac-1.3.zip`));
  assert.equal(await revokeLink(sb, c2.code), true); assert.equal([...be.objects.keys()].filter(k => k.includes(c2.code)).length, 0, 'revoke deletes the personal zip');
  const c3 = await createLink(sb, { email: 'x@y.co', orderId: 'VK-3' });
  assert.equal((await handleDownload(c3.code, 'windows', deps)).status, 303);
  be.tables.videokit_download_links.find(x => x.code === c3.code).expires_at = new Date(Date.now() - 1).toISOString();
  await createLink(sb, { email: 'x@y.co', orderId: 'VK-4' });
  assert.equal([...be.objects.keys()].filter(k => k.includes(c3.code)).length, 0, 'issue-time cleanup deletes personal zips of expired links');
  console.log('PASS: createLink (new, reuse, cleanup) and page/button with supabase client');
}

// 키트 메일: 짧은 링크 하나 + "7일 뒤(날짜) 삭제됩니다", 구매자 키 유지
{
  const o = { orderId: makeOrderId('kit', 's', randomUUID()), plan: 'kit', itemName: plans.kit.name, amount: 100000, name: '김' };
  const exp = expiryFor(NOW);
  const m = kitEmail(o, 'https://groundrooted.com/d/ABCD2345', exp, 'VK-ABCD-EFGH-JK23');
  for (const part of [m.html, m.text]) {
    assert.ok(part.includes('https://groundrooted.com/d/ABCD2345'));
    assert.ok(part.includes('이 링크는 7일 뒤(2026년 12월 4일) 삭제됩니다'), 'deletion date');
    assert.ok(part.includes('VK-ABCD-EFGH-JK23'));
    assert.ok(part.includes('※ 키트는 구매하신 분 본인만 쓸 수 있는 저작물입니다. 파일마다 주문번호가 들어 있어 유출 시 배포자를 확인할 수 있으며, 공유·재배포·재판매는 저작권법으로 금지됩니다.'), 'copyright note');
    assert.ok(part.indexOf('※ 키트는') > part.indexOf('이 링크는 7일 뒤'), 'copyright note under the link note');
    assert.ok(!part.includes('supabase.co'), 'no long signed url in the mail');
  }
  assert.ok(m.html.includes('키트 내려받기 (맥용 · 윈도우용)') && m.html.includes('0. Claude Video Kit Manual'));

  const be = fakeBackend();
  const order = { ...o, email: 'buyer@example.com' };
  assert.deepEqual(await deliverKit(order), { status: 'sent', email: 'buyer@example.com' });
  assert.deepEqual(await deliverKit(order), { status: 'sent', email: 'buyer@example.com' }, 'refresh / webhook retry');
  assert.equal(be.tables.videokit_download_links.length, 1, 'same order reuses the live link');
  const first = be.tables.videokit_download_links[0];
  assert.deepEqual({ email: first.email, name: first.name, order_id: first.order_id }, { email: 'buyer@example.com', name: '김', order_id: o.orderId });
  assert.equal(be.mails[0].text, be.mails[1].text, 'same mail body on retry (matches Resend idempotency)');
  assert.deepEqual(await deliverKit(order, { force: true }), { status: 'sent', email: 'buyer@example.com' });
  assert.equal(be.tables.videokit_download_links.length, 2, 'resend makes a new link');
  for (const [i, l] of [[0, first], [2, be.tables.videokit_download_links[1]]]) assert.ok(be.mails[i].text.includes(`https://groundrooted.com/d/${l.code}`));
  assert.equal(be.tables.videokit_licenses.length, 1, 'license key unchanged');
  for (const mail of be.mails) assert.ok(mail.text.includes(`구매자 키 (업데이트용): ${be.tables.videokit_licenses[0].key}`));
  // 링크 표가 없으면 보낼 것이 없다 → failed (메일 안 감)
  const missing = fakeBackend({ linksMissing: true });
  const quiet = console.error; console.error = () => {};
  try { assert.deepEqual(await deliverKit({ ...order, orderId: makeOrderId('kit', 's', randomUUID()) }), { status: 'failed', reason: 'download link' }); }
  finally { console.error = quiet; }
  assert.equal(missing.mails.length, 0);
  console.log('PASS: kit mail uses the short link (reuse on retry, new on resend, failed without table)');
}
