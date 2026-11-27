// 짧은 다운로드 링크(/d/<코드>)가 내려줄 키트 zip 두 개를 비공개 버킷에 올리고 kit/current.json을 바꾼다. 키트를 새로 낼 때마다 실행한다.
// 올린 파일을 다시 내려받아 sha256이 같을 때만 current.json을 바꾼다(그 전까지는 이전 버전이 계속 나간다).
// 실행 (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY):
//   node scripts/videokit-upload-link-kit.mjs <버전> <맥용.zip> <윈도우용.zip>
// 결과: kit/links/<버전>/ClaudeVideoKit-Mac-<버전>.zip, kit/links/<버전>/ClaudeVideoKit-Windows-<버전>.zip,
//       kit/current.json = {"version","mac":{"path","sha256","size"},"windows":{...}}
// 예전 경로(kit/claude-video-kit.zip 등)는 건드리지 않는다.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { fileName, isCurrent } from '../products/videokit-link.ts';

const [version, macZip, winZip] = process.argv.slice(2);
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!/^[0-9A-Za-z.]{1,40}$/.test(version ?? '') || !macZip || !winZip || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('사용법: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/videokit-upload-link-kit.mjs <버전 예: 1.3> <맥용.zip> <윈도우용.zip>');
  process.exit(2);
}
const sha = b => createHash('sha256').update(b).digest('hex');
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const bucket = process.env.VIDEOKIT_BUCKET || 'videokit';
const { data: b } = await sb.storage.getBucket(bucket);
if (!b) { console.error(`버킷 "${bucket}"이 없습니다. sql/videokit-storage.sql을 먼저 실행하세요.`); process.exit(1); }
if (b.public) { console.error(`버킷 "${bucket}"이 공개 상태입니다. 비공개로 바꾼 뒤 다시 실행하세요.`); process.exit(1); }
const storage = sb.storage.from(bucket);

const current = { version };
for (const [platform, file] of [['mac', macZip], ['windows', winZip]]) {
  const body = await readFile(file);
  const path = `kit/links/${version}/${fileName(platform, version)}`;
  const { error } = await storage.upload(path, body, { upsert: true, contentType: 'application/zip' });
  if (error) { console.error(`업로드 실패 (${path}):`, error.message); process.exit(1); }
  const { data, error: e2 } = await storage.download(path);
  if (e2 || !data) { console.error(`다시 받기 실패 (${path}):`, e2?.message); process.exit(1); }
  const back = Buffer.from(await data.arrayBuffer());
  if (sha(back) !== sha(body) || back.length !== body.length) { console.error(`sha256이 다릅니다 (${path}). current.json을 바꾸지 않습니다.`); process.exit(1); }
  current[platform] = { path, sha256: sha(body), size: body.length };
  console.log(`올림: ${file} → ${bucket}/${path} (${body.length} bytes, sha256 ${sha(body)})`);
}
if (!isCurrent(current)) { console.error('current.json 형식이 틀립니다.'); process.exit(1); }
const { error } = await storage.upload('kit/current.json', JSON.stringify(current, null, 2), { upsert: true, contentType: 'application/json', cacheControl: '0' });
if (error) { console.error('current.json 업로드 실패:', error.message); process.exit(1); }
console.log(`kit/current.json → 버전 ${version}`);
