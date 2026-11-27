// [예전 방식 — 2026-11-26까지] 키트 zip을 kit/claude-video-kit.zip(윈도우는 kit/claude-video-kit-windows.zip)에 덮어쓴다.
// 2026-11-27부터 키트는 짧은 다운로드 링크(/d/<코드>)로 보내고, 그 링크는 kit/current.json이 가리키는 파일을 내려준다.
// 새 버전은 이 스크립트가 아니라 scripts/videokit-upload-link-kit.mjs <버전> <맥.zip> <윈도우.zip> 로 올린다
// (이 스크립트로 올린 파일은 메일 · 링크 어디에서도 쓰지 않는다). 예전 경로를 다시 쓸 일이 있을 때만 실행한다.
// 실행: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/videokit-upload-kit.mjs <키트.zip>
// 윈도우용은 경로를 바꿔 올린다: VIDEOKIT_KIT_PATH=kit/claude-video-kit-windows.zip node scripts/videokit-upload-kit.mjs <윈도우 키트.zip>
import { readFile, stat } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const file = process.argv[2];
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const bucket = process.env.VIDEOKIT_BUCKET || 'videokit';
const path = process.env.VIDEOKIT_KIT_PATH || 'kit/claude-video-kit.zip';
if (!file || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('사용법: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/videokit-upload-kit.mjs <키트.zip>');
  process.exit(2);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: b } = await sb.storage.getBucket(bucket);
if (!b) { console.error(`버킷 "${bucket}"이 없습니다. sql/videokit-storage.sql을 먼저 실행하세요.`); process.exit(1); }
if (b.public) { console.error(`버킷 "${bucket}"이 공개 상태입니다. 비공개로 바꾼 뒤 다시 실행하세요.`); process.exit(1); }
const body = await readFile(file);
const { error } = await sb.storage.from(bucket).upload(path, body, { upsert: true, contentType: 'application/zip' });
if (error) { console.error('업로드 실패:', error.message); process.exit(1); }
console.log(`올림: ${file} (${((await stat(file)).size / 1048576).toFixed(1)} MB) → ${bucket}/${path}`);
