// 판매용 키트 zip을 Supabase Storage 비공개 버킷에 올린다. 키트를 새로 만들 때마다 다시 실행한다.
// 이미 보낸 메일의 링크도 같은 경로를 가리키므로, 링크가 유효한 동안에는 새 파일이 내려받아진다.
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
