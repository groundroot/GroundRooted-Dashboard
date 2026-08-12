// YouTube 수집기 — 채널의 최근 업로드를 events에 기록한다.
// env: YOUTUBE_API_KEY, YT_CHANNEL_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { requireEnv, sbInsertIgnore, DRY } from "./lib.mjs";

requireEnv();
const KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;
if (!KEY || !CHANNEL) {
  console.log("YOUTUBE_API_KEY / YT_CHANNEL_ID 미설정 — 유튜브 수집 건너뜀");
  process.exit(0);
}

async function yt(path, params) {
  const q = new URLSearchParams({ ...params, key: KEY });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${q}`);
  if (!r.ok) throw new Error(`YouTube ${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

// 채널 → 업로드 재생목록 → 최근 항목
const ch = await yt("channels", { part: "contentDetails,statistics", id: CHANNEL });
const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
if (!uploads) { console.error("채널을 찾을 수 없습니다"); process.exit(1); }

const items = await yt("playlistItems", { part: "snippet", playlistId: uploads, maxResults: "10" });
const since = Date.now() - 26 * 3600 * 1000;

const events = (items.items ?? [])
  .filter((i) => new Date(i.snippet.publishedAt).getTime() >= since)
  .map((i) => ({
    source: "youtube",
    type: "upload_done",
    title: `유튜브 업로드 — ${i.snippet.title}`,
    external_id: i.snippet.resourceId.videoId,
    occurred_at: i.snippet.publishedAt,
    detail: { url: `https://youtu.be/${i.snippet.resourceId.videoId}` },
  }));

await sbInsertIgnore("events", events, "source,external_id");

const stats = ch.items[0].statistics;
console.log(`업로드 ${events.length}건 기록 · 채널 구독 ${stats.subscriberCount} · 총 조회 ${stats.viewCount}${DRY ? " (DRY)" : ""}`);
