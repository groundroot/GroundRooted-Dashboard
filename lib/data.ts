import { createClient } from "@supabase/supabase-js";

export type Project = {
  id: string;
  slug: string;
  name: string;
  kind: "app" | "music" | "platform" | "plugin" | "site";
  stage: string;
  repo: string | null;
  status: "active" | "paused" | "done" | "archived";
  updated_at: string;
};

export type Album = {
  id: string;
  title: string;
  planned_at: string | null;
  generated_at: string | null;
  downloaded_at: string | null;
  uploaded_at: string | null;
  distributed_at: string | null;
  youtube_url: string | null;
};

export type EventRow = {
  id: number;
  source: string;
  type: string;
  title: string;
  occurred_at: string;
};

export type RevenuePoint = { date: string; amount: number };

export type Briefing = { brief_date: string; summary_md: string } | null;

export type AiUsageRow = {
  tool: string;
  model: string;
  input_tokens: number;
  cache_write_tokens: number;
  cache_read_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

export type AiUsage = {
  monthCost: number;
  totalCost: number;
  byTool: { tool: string; cost: number; tokens: number }[];
  topModels: { model: string; tool: string; cost: number }[];
};

export type DashboardData = {
  demo: boolean;
  projects: Project[];
  albums: Album[];
  events: EventRow[];
  revenueDaily: RevenuePoint[]; // 최근 30일
  revenueToday: number;
  revenueMonth: number;
  briefing: Briefing;
  aiUsage: AiUsage;
};

const EMPTY_AI_USAGE: AiUsage = { monthCost: 0, totalCost: 0, byTool: [], topModels: [] };

/** ai_usage 행들을 도구별·모델별로 접는다. */
function foldAiUsage(rows: (AiUsageRow & { usage_date: string })[], monthStart: Date): AiUsage {
  const tools = new Map<string, { cost: number; tokens: number }>();
  const models = new Map<string, { model: string; tool: string; cost: number }>();
  let monthCost = 0;
  let totalCost = 0;

  for (const r of rows) {
    const cost = Number(r.cost_usd);
    const tokens =
      Number(r.input_tokens) +
      Number(r.cache_write_tokens) +
      Number(r.cache_read_tokens) +
      Number(r.output_tokens);
    totalCost += cost;
    if (new Date(r.usage_date) >= monthStart) monthCost += cost;

    const t = tools.get(r.tool) ?? { cost: 0, tokens: 0 };
    tools.set(r.tool, { cost: t.cost + cost, tokens: t.tokens + tokens });

    const key = `${r.tool}|${r.model}`;
    const m = models.get(key) ?? { model: r.model, tool: r.tool, cost: 0 };
    models.set(key, { ...m, cost: m.cost + cost });
  }

  return {
    monthCost,
    totalCost,
    byTool: [...tools.entries()]
      .map(([tool, v]) => ({ tool, ...v }))
      .sort((a, b) => b.cost - a.cost),
    topModels: [...models.values()].sort((a, b) => b.cost - a.cost).slice(0, 6),
  };
}

// 서버 전용 키로 읽는다 — 이 파일은 서버 컴포넌트에서만 실행되고, 사이트 전체는
// middleware.ts의 비밀번호로 막혀 있다. anon 키로는 RLS(to authenticated)에 막혀 빈 값만 온다.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = Boolean(url && key);

function iso(daysAgo: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateStr(daysAgo: number): string {
  return iso(daysAgo).slice(0, 10);
}

/** 데모(목) 데이터 — Supabase 키가 없을 때 대시보드 형태를 보여주기 위한 것 */
function mockData(): DashboardData {
  const seed = [4, 0, 12, 7, 0, 18, 9, 5, 0, 22, 14, 3, 8, 0, 11, 6, 19, 2, 0, 9, 13, 4, 7, 16, 0, 5, 10, 3, 12, 8];
  const revenueDaily: RevenuePoint[] = seed.map((v, i) => ({
    date: dateStr(29 - i),
    amount: v * 3.5,
  }));
  const revenueToday = revenueDaily[revenueDaily.length - 1].amount;
  const revenueMonth = revenueDaily.slice(-11).reduce((s, p) => s + p.amount, 0);

  return {
    demo: true,
    projects: [
      { id: "1", slug: "prayerwire", name: "PrayerWire", kind: "platform", stage: "개발", repo: "groundrooted/prayerwire", status: "active", updated_at: iso(0, 9) },
      { id: "2", slug: "app-alpha", name: "앱 프로젝트 A (Orca)", kind: "app", stage: "테스트", repo: "groundrooted/app-alpha", status: "active", updated_at: iso(1) },
      { id: "3", slug: "app-beta", name: "앱 프로젝트 B (Orca)", kind: "app", stage: "스토어 심사", repo: "groundrooted/app-beta", status: "active", updated_at: iso(2) },
      { id: "4", slug: "streamdeck-plugin", name: "Stream Deck 플러그인", kind: "plugin", stage: "출시", repo: "groundrooted/sd-plugin", status: "active", updated_at: iso(5) },
      { id: "5", slug: "suno-hymns", name: "Suno 찬양 앨범 시리즈", kind: "music", stage: "제작", repo: null, status: "active", updated_at: iso(0, 7) },
      { id: "6", slug: "groundrooted-site", name: "GroundRooted 판매 사이트", kind: "site", stage: "기획", repo: null, status: "active", updated_at: iso(3) },
    ],
    albums: [
      { id: "a1", title: "Hymns of Dawn Vol.1", planned_at: iso(9), generated_at: iso(8), downloaded_at: iso(8), uploaded_at: iso(7), distributed_at: iso(5), youtube_url: "#" },
      { id: "a2", title: "Prayer & Peace Vol.2", planned_at: iso(4), generated_at: iso(3), downloaded_at: iso(3), uploaded_at: iso(1), distributed_at: null, youtube_url: "#" },
      { id: "a3", title: "Morning Worship Vol.3", planned_at: iso(1), generated_at: iso(0, 6), downloaded_at: null, uploaded_at: null, distributed_at: null, youtube_url: null },
      { id: "a4", title: "Evening Grace Vol.4", planned_at: iso(0, 8), generated_at: null, downloaded_at: null, uploaded_at: null, distributed_at: null, youtube_url: null },
    ],
    events: [
      { id: 1, source: "suno", type: "stage_change", title: "Morning Worship Vol.3 — Suno 생성 완료", occurred_at: iso(0, 6) },
      { id: 2, source: "github", type: "commit", title: "prayerwire: 기도 요청 알림 기능 커밋 3건", occurred_at: iso(0, 9) },
      { id: 3, source: "youtube", type: "upload_done", title: "Prayer & Peace Vol.2 유튜브 업로드 완료", occurred_at: iso(1) },
      { id: 4, source: "stripe", type: "sale", title: "사이트 판매 — 앱 라이선스 1건 ($28)", occurred_at: iso(1, 20) },
      { id: 5, source: "github", type: "release", title: "app-beta v0.9.0 릴리스 → 스토어 심사 제출", occurred_at: iso(2) },
      { id: 6, source: "elgato", type: "sale", title: "Elgato 마켓플레이스 — 플러그인 2건 판매", occurred_at: iso(3) },
    ],
    revenueDaily,
    revenueToday,
    revenueMonth,
    briefing: {
      brief_date: dateStr(0),
      summary_md:
        "어제 매출 $42 (사이트 1건, Elgato 2건). Prayer & Peace Vol.2 유튜브 업로드 완료, 음원 유통 등록 대기 중. app-beta 스토어 심사 3일째 — 지연 시 확인 필요. PrayerWire 알림 기능 개발 진행 중.",
    },
    aiUsage: {
      monthCost: 812.4,
      totalCost: 4210.5,
      byTool: [
        { tool: "claude-code", cost: 3600.2, tokens: 980_000_000 },
        { tool: "codex", cost: 560.1, tokens: 210_000_000 },
        { tool: "cline", cost: 50.2, tokens: 12_000_000 },
      ],
      topModels: [
        { model: "claude-opus-5", tool: "claude-code", cost: 2100.0 },
        { model: "claude-fable-5", tool: "claude-code", cost: 1500.2 },
        { model: "gpt-5.4", tool: "codex", cost: 560.1 },
      ],
    },
  };
}

async function liveData(): Promise<DashboardData> {
  const supabase = createClient(url!, key!);
  const since30 = new Date();
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [projects, albums, events, revenue, briefing, aiUsage] = await Promise.all([
    supabase.from("projects").select("*").neq("status", "archived").order("updated_at", { ascending: false }),
    supabase.from("albums").select("*").order("planned_at", { ascending: false }).limit(8),
    supabase.from("events").select("id,source,type,title,occurred_at").order("occurred_at", { ascending: false }).limit(20),
    supabase.from("revenue").select("amount,occurred_at").gte("occurred_at", since30.toISOString()),
    supabase.from("briefings").select("brief_date,summary_md").order("brief_date", { ascending: false }).limit(1),
    supabase
      .from("ai_usage")
      .select("tool,model,usage_date,input_tokens,cache_write_tokens,cache_read_tokens,output_tokens,cost_usd"),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since30);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  let revenueToday = 0;
  let revenueMonth = 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  for (const r of revenue.data ?? []) {
    const key = String(r.occurred_at).slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(r.amount));
    if (key === todayKey) revenueToday += Number(r.amount);
    if (new Date(r.occurred_at) >= monthStart) revenueMonth += Number(r.amount);
  }

  return {
    demo: false,
    projects: (projects.data ?? []) as Project[],
    albums: (albums.data ?? []) as Album[],
    events: (events.data ?? []) as EventRow[],
    revenueDaily: [...byDay.entries()].map(([date, amount]) => ({ date, amount })),
    revenueToday,
    revenueMonth,
    briefing: briefing.data?.[0] ?? null,
    aiUsage: aiUsage.data ? foldAiUsage(aiUsage.data as never, monthStart) : EMPTY_AI_USAGE,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabase) return mockData();
  try {
    return await liveData();
  } catch {
    return mockData();
  }
}
