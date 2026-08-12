// Suno 파이프라인 상태 보고 CLI — 기존 자동화 스크립트가 각 단계 완료 시 호출한다.
//
// 사용:
//   node report-suno.mjs --title "Hymns of Dawn Vol.1" --stage generated
//   node report-suno.mjs --title "..." --stage uploaded --url https://youtu.be/xxx
//   node report-suno.mjs --title "..." --stage distributed --distributor distrokid
//
// stage: planned | generated | downloaded | uploaded | distributed
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { requireEnv, sbSelect, sbUpsert, sbUpdate, sbInsertIgnore, DRY } from "./lib.mjs";

requireEnv();

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}

const STAGE_COL = {
  planned: "planned_at",
  generated: "generated_at",
  downloaded: "downloaded_at",
  uploaded: "uploaded_at",
  distributed: "distributed_at",
};
const STAGE_KO = { planned: "기획", generated: "Suno 생성", downloaded: "다운로드", uploaded: "유튜브 업로드", distributed: "음원 유통 등록" };

const { title, stage, url, distributor } = args;
if (!title || !STAGE_COL[stage]) {
  console.error("사용법: node report-suno.mjs --title <앨범명> --stage planned|generated|downloaded|uploaded|distributed [--url ...] [--distributor ...]");
  process.exit(1);
}

const now = new Date().toISOString();
const enc = encodeURIComponent(title);

// 앨범이 없으면 생성, 있으면 해당 단계 타임스탬프 갱신
const existing = await sbSelect("albums", `select=id&title=eq.${enc}&limit=1`);
const patch = { [STAGE_COL[stage]]: now, updated_at: now };
if (url) patch.youtube_url = url;
if (distributor) patch.distributor = distributor;

if (existing.length || DRY) {
  await sbUpdate("albums", `title=eq.${enc}`, patch);
} else {
  await sbUpsert("albums", { title, ...patch }, "id");
}

await sbInsertIgnore(
  "events",
  {
    source: "suno",
    type: "stage_change",
    title: `${title} — ${STAGE_KO[stage]} 완료`,
    external_id: `${title}-${stage}`,
    occurred_at: now,
    detail: { stage, ...(url ? { url } : {}) },
  },
  "source,external_id"
);

console.log(`✓ ${title} → ${STAGE_KO[stage]}${DRY ? " (DRY)" : ""}`);
