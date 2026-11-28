// 키트 zip에 구매자 표식(주문번호 · 링크 발급일 · 링크 코드)을 넣는다 (서버 전용).
// 다운로드 버튼(/d/<코드>/mac|windows)이 원본 zip으로 이 함수를 불러 개인 zip을 만든다(products/videokit-link.ts).
// 표식 위치:
//   보이는 것  Claude Video Kit/LICENSE.txt (새 파일)
//   숨은 것    zip 주석 · System/MANIFEST.json의 "license" 필드 · CLAUDE.md와 System/CLAUDE.md 끝의 HTML 주석
//   링크 태그  (계약 v3 §5, linkTag가 있을 때) 스킬 md 10개 끝 <!-- vk:태그 -->, 설명서 PDF(Keywords · XMP dc:identifier ·
//             마지막 쪽 아래 여백의 흰색 1pt '주문 …'), 설명서 EPUB(OPF dc:identifier id="vk" · 첫 CSS 끝 주석). 태그는 파일마다 다르다.
// 키트 업데이트(System/scripts/update.py)는 설치본 sha256이 MANIFEST와 같아야 '고치지 않은 키트 파일'로 보고 새 버전으로 바꾼다.
// 그래서 표식을 넣은 모든 파일의 sha256을 MANIFEST에서 함께 바꾸고, 마지막에 MANIFEST의 모든 해시가 zip 안 내용과 같은지 다시 확인한다
// (하나라도 다르면 throw — 링크 발급 실패, 표식 없는 zip을 주지 않음).
// 바꾸지 않는 항목은 이름 · extra · 외부 속성(권한 · 심볼릭 링크) · 압축 데이터를 바이트 그대로 옮긴다. zip64 · data descriptor는 받지 않는다(throw).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFName, PDFRawStream, rgb } from 'pdf-lib';

export type Mark = { orderId: string; issued: string; code: string };   // issued: 'YYYY-MM-DD' (KST)

const TOP = 'Claude Video Kit/';
export const LICENSE_PATH = `${TOP}LICENSE.txt`;
const MANIFEST_PATH = `${TOP}System/MANIFEST.json`;
const COMMENTED = ['CLAUDE.md', 'System/CLAUDE.md'];   // MANIFEST 기준 상대 경로
// 링크 태그를 끝에 다는 스킬 (계약 v3 §5 1번, 판에 없는 것은 건너뜀)
export const TAGGED_SKILLS = ['shorts', 'talking-head-highlight', 'interview-documentary', 'captions', 'event-review-edit', 'viral-video-research',
  'podcast-multicam', 'openmotion', 'motion-design', 'service-cut'].map(s => `.claude/skills/${s}/SKILL.md`);
export const MANUAL_DIR = '0. Claude Video Kit Manual/';
// 설명서 PDF의 '주문 …' 글자용 한글 글꼴: pretendard 1.3.9 패키지의 Pretendard-Regular.ttf를 고치지 않고 복사(OFL 1.1, THIRD_PARTY_NOTICES.md).
// node_modules 경로는 pnpm 심볼릭 링크라 Vercel 함수 번들에서 같은 경로로 열리지 않으므로 저장소에 두고,
// next.config.mjs outputFileTracingIncludes로 /d/ 함수에 싣는다. PDF에는 쓰인 글자만 부분 집합으로 들어간다.
export const PDF_FONT = 'products/fonts/Pretendard-Regular.ttf';
let fontBytes: Buffer | null = null;
const pdfFont = () => (fontBytes ??= readFileSync(join(process.cwd(), PDF_FONT)));

export function licenseText(m: Mark) {
  return [
    '클로드 비디오 키트 이용 허락 (Claude Video Kit License)',
    '',
    `이 키트는 주문번호 ${m.orderId}의 구매자 본인용입니다. (발급일 ${m.issued}, 링크 ${m.code})`,
    '클로드 비디오 키트(설명서 · 스크립트 · 스킬 · 프리셋 포함)는 그라운드루티드의 저작물로 저작권법의 보호를 받습니다.',
    '구매하신 분 본인의 영상 제작에만 쓸 수 있으며, 파일을 다른 사람에게 공유 · 복제 · 재배포 · 재판매하는 것은 금지됩니다.',
    '키트 파일에는 이 주문번호가 여러 곳에 들어 있어, 파일이 유출되면 주문번호로 배포자를 확인합니다.',
    '위반하면 저작권법에 따라 민사 · 형사상 책임을 질 수 있습니다. 이용약관: https://groundrooted.com/videokit/terms',
    '',
    `This kit is licensed to the purchaser of order ${m.orderId} only. Sharing or redistribution is prohibited; leaked copies are traced by order number.`,
    '',
  ].join('\r\n');
}
const markLine = (m: Mark) => `Claude Video Kit · order ${m.orderId} · issued ${m.issued} · link ${m.code}`;

// ---- zip 읽기 ----
type Entry = { name: string; cd: Buffer; local: Buffer; data: Buffer; flags: number; method: number; crc: number; usize: number };
const SIG_EOCD = 0x06054b50, SIG_CD = 0x02014b50, SIG_LOCAL = 0x04034b50;

function readZip(buf: Buffer): Entry[] {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) if (buf.readUInt32LE(i) === SIG_EOCD) { eocd = i; break; }
  if (eocd < 0) throw new Error('zip: no end of central directory');
  const count = buf.readUInt16LE(eocd + 10), cdOffset = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdOffset === 0xffffffff) throw new Error('zip: zip64 is not supported');
  const out: Entry[] = [];
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== SIG_CD) throw new Error('zip: bad central directory');
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    if (csize === 0xffffffff || usize === 0xffffffff || off === 0xffffffff) throw new Error('zip: zip64 is not supported');
    if (flags & 0x8) throw new Error('zip: data descriptor is not supported');
    if (flags & 0x1) throw new Error('zip: encrypted entries are not supported');
    const cd = buf.subarray(p, p + 46 + nl + el + cl);
    if (buf.readUInt32LE(off) !== SIG_LOCAL) throw new Error('zip: bad local header');
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28);
    const local = buf.subarray(off, off + 30 + lnl + lel);
    const data = buf.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + csize);
    out.push({ name: buf.toString('utf8', p + 46, p + 46 + nl), cd, local, data, flags, method, crc, usize });
    p += cd.length;
  }
  return out;
}

function inflate(e: Entry): Buffer {
  if (e.method === 0) return Buffer.from(e.data);
  if (e.method === 8) return inflateRawSync(e.data);
  throw new Error(`zip: unsupported method ${e.method} (${e.name})`);
}

// 내용만 바꾼다: 이름 · extra · 시각 · 외부 속성은 원래 것.
function replaceContent(e: Entry, content: Buffer): Entry {
  const data = deflateRawSync(content, { level: 9 });
  const crc = crc32(content) >>> 0;
  const local = Buffer.from(e.local), cd = Buffer.from(e.cd);
  for (const [h, o] of [[local, 8], [cd, 10]] as const) {
    h.writeUInt16LE(8, o);                     // method
    h.writeUInt32LE(crc, o + 6);
    h.writeUInt32LE(data.length, o + 10);
    h.writeUInt32LE(content.length, o + 14);
  }
  return { ...e, local, cd, data, method: 8, crc, usize: content.length };
}

function dosTime(d: Date) {
  return { time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1),
    date: ((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate() };
}

function newFile(name: string, content: Buffer, when: Date): Entry {
  const nameBuf = Buffer.from(name, 'utf8');
  const data = deflateRawSync(content, { level: 9 });
  const crc = crc32(content) >>> 0;
  const { time, date } = dosTime(when);
  const local = Buffer.alloc(30 + nameBuf.length);
  local.writeUInt32LE(SIG_LOCAL, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8);
  local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12); local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(nameBuf.length, 26); nameBuf.copy(local, 30);
  const cd = Buffer.alloc(46 + nameBuf.length);
  cd.writeUInt32LE(SIG_CD, 0); cd.writeUInt16LE(0x031e, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0x800, 8); cd.writeUInt16LE(8, 10);
  cd.writeUInt16LE(time, 12); cd.writeUInt16LE(date, 14); cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(data.length, 20); cd.writeUInt32LE(content.length, 24);
  cd.writeUInt16LE(nameBuf.length, 28); cd.writeUInt32LE((0o100644 << 16) >>> 0, 38); nameBuf.copy(cd, 46);
  return { name, cd, local, data, flags: 0x800, method: 8, crc, usize: content.length };
}

function writeZip(entries: Entry[], comment: string): Buffer {
  const parts: Buffer[] = [], cds: Buffer[] = [];
  let off = 0;
  for (const e of entries) {
    const cd = Buffer.from(e.cd);
    cd.writeUInt32LE(off, 42);
    parts.push(e.local, e.data); cds.push(cd);
    off += e.local.length + e.data.length;
  }
  const cdBuf = Buffer.concat(cds), c = Buffer.from(comment, 'utf8');
  if (entries.length >= 0xffff || off + cdBuf.length >= 0xffffffff || c.length > 0xffff) throw new Error('zip: too large');
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(SIG_EOCD, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(off, 16); eocd.writeUInt16LE(c.length, 20);
  return Buffer.concat([...parts, cdBuf, eocd, c]);
}

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

// ---- 설명서 표식 (계약 v3 §5 2 · 3번) ----
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
const xmp = (tag: string) => `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
${xmpDescription(tag)}
</rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;
const xmpDescription = (tag: string) => `<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier>vk:${esc(tag)}</dc:identifier></rdf:Description>`;

// PDF: Info Keywords에 vk:태그(기존 값 뒤에), XMP dc:identifier, 마지막 쪽 아래 여백에 흰색 1pt '주문 …'. 본문 · 쪽 수는 그대로.
export async function markPdf(pdf: Buffer, tag: string, orderId: string): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const kw = doc.getKeywords();
  doc.setKeywords([...(kw ? [kw] : []), `vk:${tag}`]);
  // XMP: 이미 있고 압축되지 않았으면 그 안에 Description 하나를 더한다. 없거나 읽을 수 없으면 새로 단다.
  const old = doc.catalog.lookup(PDFName.of('Metadata'));
  const oldText = old instanceof PDFRawStream && !old.dict.get(PDFName.of('Filter')) ? Buffer.from(old.contents).toString('utf8') : '';
  const text = oldText.includes('</rdf:RDF>') ? oldText.replace('</rdf:RDF>', `${xmpDescription(tag)}\n</rdf:RDF>`) : xmp(tag);
  const meta = doc.context.stream(Buffer.from(text, 'utf8'), { Type: 'Metadata', Subtype: 'XML' });
  doc.catalog.set(PDFName.of('Metadata'), doc.context.register(meta));
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(pdfFont(), { subset: true });
  const page = doc.getPage(doc.getPageCount() - 1);
  const box = page.getMediaBox();
  page.drawText(`주문 ${orderId}`, { x: box.x + 36, y: box.y + 4, size: 1, font, color: rgb(1, 1, 1) });
  return Buffer.from(await doc.save({ useObjectStreams: false, updateFieldAppearances: false }));
}

// EPUB: OPF에 <dc:identifier id="vk">vk:태그</dc:identifier>를 하나 더(기존 identifier는 그대로), 첫 CSS 끝에 주석.
// 바꾼 두 항목만 교체하므로 mimetype은 맨 앞 · 무압축 그대로 남는다.
export function markEpub(epub: Buffer, tag: string, orderId: string): Buffer {
  const entries = readZip(epub);
  const container = entries.find(e => e.name === 'META-INF/container.xml');
  const opfPath = container && /full-path="([^"]+)"/.exec(inflate(container).toString('utf8'))?.[1];
  const oi = entries.findIndex(e => e.name === opfPath);
  if (oi < 0) throw new Error('epub: no OPF');
  const opf = inflate(entries[oi]).toString('utf8');
  const end = /<\/(?:[\w-]+:)?metadata>/.exec(opf);
  if (!end || /\bid="vk"/.test(opf)) throw new Error('epub: unexpected OPF');
  const next = opf.slice(0, end.index) + `<dc:identifier id="vk">vk:${esc(tag)}</dc:identifier>\n` + opf.slice(end.index);
  entries[oi] = replaceContent(entries[oi], Buffer.from(next, 'utf8'));
  const ci = entries.findIndex(e => e.name.toLowerCase().endsWith('.css'));
  if (ci >= 0) entries[ci] = replaceContent(entries[ci], Buffer.concat([inflate(entries[ci]), Buffer.from(`\n/* vk:${tag} 주문 ${orderId} */\n`, 'utf8')]));
  return writeZip(entries, '');
}

const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 원본 키트 zip → 표식을 넣은 zip. 키트 구조(System/MANIFEST.json, CLAUDE.md 두 개)가 없으면 throw(원본을 그대로 내보내지 않게).
// linkTag: 키트 안 경로 → 링크 태그(12자, 계약 v3 §5). 없으면(VIDEOKIT_MARK_SECRET 미설정) v3 링크 태그 없이 종전 표식만 넣는다.
export async function watermarkKit(zip: Buffer, m: Mark, o: { linkTag?: (path: string) => string } = {}): Promise<Buffer> {
  const entries = readZip(zip);
  const idx = (name: string) => entries.findIndex(e => e.name === name);
  if (idx(LICENSE_PATH) >= 0) throw new Error('zip: already has LICENSE.txt');
  const mi = idx(MANIFEST_PATH);
  if (mi < 0) throw new Error('zip: no System/MANIFEST.json');
  const manifestText = inflate(entries[mi]).toString('utf8');
  const manifest = JSON.parse(manifestText) as { files?: Record<string, { sha256?: string }> };
  if (!manifest.files) throw new Error('zip: MANIFEST.json has no files');
  const note = `\n<!-- ${markLine(m)} -->\n`;
  const hashes: Record<string, string> = {};
  const change = (i: number, rel: string, body: Buffer) => { entries[i] = replaceContent(entries[i], body); hashes[rel] = sha256(body); };
  for (const rel of COMMENTED) {
    const i = idx(TOP + rel);
    if (i < 0) throw new Error(`zip: no ${rel}`);
    change(i, rel, Buffer.concat([inflate(entries[i]), Buffer.from(note, 'utf8')]));
  }
  if (o.linkTag) {
    for (const rel of TAGGED_SKILLS) {
      const i = idx(TOP + rel);
      if (i >= 0) change(i, rel, Buffer.concat([inflate(entries[i]), Buffer.from(`\n<!-- vk:${o.linkTag(rel)} -->\n`, 'utf8')]));
    }
    for (let i = 0; i < entries.length; i++) {
      const rel = entries[i].name.slice(TOP.length);
      if (!entries[i].name.startsWith(TOP + MANUAL_DIR) || rel.slice(MANUAL_DIR.length).includes('/')) continue;
      if (/\.pdf$/i.test(rel)) change(i, rel, await markPdf(inflate(entries[i]), o.linkTag(rel), m.orderId));
      else if (/\.epub$/i.test(rel)) change(i, rel, markEpub(inflate(entries[i]), o.linkTag(rel), m.orderId));
    }
  }
  // MANIFEST: 맨 앞에 "license"를 넣고 바꾼 파일의 sha256만 바꾼다. 나머지 글자는 그대로.
  // CLAUDE.md 두 개는 MANIFEST에 꼭 있어야 하고, 나머지(스킬 · 설명서)는 MANIFEST에 있을 때만 바꾼다.
  const license = JSON.stringify({ order: m.orderId, issued: m.issued, link: m.code });
  if (!manifestText.startsWith('{\n')) throw new Error('zip: unexpected MANIFEST.json layout');
  let next = `{\n"license": ${license},\n` + manifestText.slice(2);
  for (const [rel, hash] of Object.entries(hashes)) {
    const old = manifest.files[rel]?.sha256;
    if (!old && !COMMENTED.includes(rel)) continue;
    const at = new RegExp(`("${reEscape(rel)}":\\s*\\{\\s*"sha256":\\s*")${old}"`);
    if (!old || !at.test(next)) throw new Error(`zip: MANIFEST.json has no sha256 for ${rel}`);
    next = next.replace(at, `$1${hash}"`);
  }
  const files = (JSON.parse(next) as { files: Record<string, { sha256?: string; link?: string }> }).files;   // 깨진 JSON을 내보내지 않는다
  // MANIFEST의 모든 해시 = zip 안 실제 내용. 하나라도 다르면 업데이트가 그 파일을 '구매자가 고친 것'으로 보므로 내보내지 않는다.
  // 맥용 zip의 심볼릭 링크 항목({"link": 대상}, sha256 없음)은 zip 항목 내용(= 링크 대상)이 같은지만 본다.
  for (const [rel, f] of Object.entries(files)) {
    const i = idx(TOP + rel);
    const ok = i >= 0 && (typeof f.sha256 === 'string' ? (hashes[rel] ?? sha256(inflate(entries[i]))) === f.sha256
      : typeof f.link === 'string' && inflate(entries[i]).toString('utf8') === f.link);
    if (!ok) throw new Error(`zip: MANIFEST sha256 does not match ${rel}`);
  }
  entries[mi] = replaceContent(entries[mi], Buffer.from(next, 'utf8'));
  entries.push(newFile(LICENSE_PATH, Buffer.from('\uFEFF' + licenseText(m), 'utf8'), new Date(`${m.issued}T00:00:00Z`)));
  return writeZip(entries, markLine(m));
}

// 테스트용: 파일 목록으로 zip을 만들고(buildZip), zip 안 파일 내용 · 외부 속성 · 주석을 읽는다(readZipFiles).
// 콘텐츠 개인 사본(products/videokit-mark.ts)도 이것으로 만든다: 항목 시각 고정, DEFLATE, 권한 0644.
export function buildZip(files: { name: string; content: string | Buffer }[], comment = '', when = new Date('2026-11-26T00:00:00Z')) {
  return writeZip(files.map(f => newFile(f.name, Buffer.from(f.content), when)), comment);
}
export function readZipFiles(zip: Buffer) {
  const files = new Map(readZip(zip).map(e => [e.name, { content: inflate(e), externalAttr: e.cd.readUInt32LE(38) >>> 0 }]));
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  return { files, comment: zip.toString('utf8', end + 22, end + 22 + zip.readUInt16LE(end + 20)) };
}
