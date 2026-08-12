import { getDashboardData, type Album, type Project } from "@/lib/data";
import RevenueChart from "@/components/RevenueChart";

export const revalidate = 60; // 1분마다 서버 데이터 갱신

const KIND_LABEL: Record<Project["kind"], string> = {
  app: "앱",
  music: "음악",
  platform: "플랫폼",
  plugin: "플러그인",
  site: "사이트",
};

const PIPELINE_STEPS: { key: keyof Album; label: string }[] = [
  { key: "planned_at", label: "기획" },
  { key: "generated_at", label: "생성" },
  { key: "downloaded_at", label: "다운로드" },
  { key: "uploaded_at", label: "업로드" },
  { key: "distributed_at", label: "유통" },
];

// 순차(ordinal) 램프 — 단계가 진행될수록 진해짐 (dataviz ordinal 규칙: 250~650)
const STEP_COLORS = ["var(--seq-250)", "var(--seq-350)", "var(--seq-450)", "var(--seq-550)", "var(--seq-650)"];

function stageDot(stage: string): string {
  if (/심사|검토/.test(stage)) return "var(--status-warning)";
  if (/출시|완료|운영/.test(stage)) return "var(--status-good)";
  return "var(--series-1)";
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "방금";
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function Page() {
  const d = await getDashboardData();
  const activeProjects = d.projects.filter((p) => p.status === "active");
  const inFlight = d.albums.filter((a) => !a.distributed_at);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          GroundRooted HQ<small>앱 · 음악 · 판매 · PrayerWire 운영 현황</small>
        </div>
        {d.demo && <span className="demo-chip">데모 데이터 — Supabase 연결 전</span>}
      </header>

      <section className="grid tiles">
        <div className="card tile">
          <div className="label">오늘 매출</div>
          <div className="value">${d.revenueToday.toFixed(0)}</div>
          <div className="delta">전 채널 합산</div>
        </div>
        <div className="card tile">
          <div className="label">이번 달 매출</div>
          <div className="value">${d.revenueMonth.toFixed(0)}</div>
          <div className="delta up">↑ 집계 중</div>
        </div>
        <div className="card tile">
          <div className="label">진행 중 프로젝트</div>
          <div className="value">{activeProjects.length}</div>
          <div className="delta">앱 · 음악 · 플랫폼</div>
        </div>
        <div className="card tile">
          <div className="label">파이프라인 앨범</div>
          <div className="value">{inFlight.length}</div>
          <div className="delta">유통 등록 대기 포함</div>
        </div>
      </section>

      <div className="grid main">
        <div className="col">
          <section className="card">
            <h2>
              일별 매출<span className="sub">최근 30일 · USD</span>
            </h2>
            <RevenueChart data={d.revenueDaily} />
          </section>

          <section className="card">
            <h2>프로젝트 보드</h2>
            <div className="plist">
              {activeProjects.map((p) => (
                <div className="prow" key={p.id}>
                  <span className="kind">{KIND_LABEL[p.kind]}</span>
                  <span className="pname">
                    {p.name}
                    {p.repo && <span className="pmeta"> · {p.repo}</span>}
                  </span>
                  <span className="stage">
                    <span className="dot" style={{ background: stageDot(p.stage) }} aria-hidden />
                    {p.stage}
                  </span>
                  <span className="pmeta">{timeAgo(p.updated_at)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Suno 앨범 파이프라인</h2>
            {d.albums.map((a) => {
              const done = PIPELINE_STEPS.filter((s) => a[s.key]).length;
              const current = done < PIPELINE_STEPS.length ? PIPELINE_STEPS[done].label + " 대기" : "완료";
              return (
                <div className="album" key={a.id}>
                  <div className="t">
                    <span className="title">{a.title}</span>
                    <span className="state">
                      {done}/{PIPELINE_STEPS.length} · {current}
                    </span>
                  </div>
                  <div className="steps" role="img" aria-label={`${a.title} 파이프라인 ${done}/${PIPELINE_STEPS.length} 단계 완료`}>
                    {PIPELINE_STEPS.map((s, i) => (
                      <span
                        key={s.key}
                        className="step"
                        style={i < done ? { background: STEP_COLORS[i] } : undefined}
                      />
                    ))}
                  </div>
                  <div className="steplbls">
                    {PIPELINE_STEPS.map((s) => (
                      <span key={s.key}>{s.label}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="card">
            <h2>
              AI 에이전트 비용<span className="sub">실제 지출 vs 정가 환산 사용액</span>
            </h2>
            <div className="ai-head">
              <div>
                <div className="label">이번 달 실제 지출</div>
                <div className="value">${d.aiUsage.actualMonth.toFixed(0)}</div>
                <div className="ai-sub">
                  구독 ${d.aiUsage.fixedMonthly.toFixed(0)} + 종량 ${d.aiUsage.meteredMonth.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="label">이번 달 사용액 (정가 환산)</div>
                <div className="value">${d.aiUsage.monthCost.toFixed(0)}</div>
                <div className="ai-sub up">
                  지출 대비 {(d.aiUsage.monthCost / Math.max(1, d.aiUsage.actualMonth)).toFixed(1)}배
                </div>
              </div>
            </div>

            <div className="ai-subs">
              {d.aiUsage.subscriptions.map((s) => (
                <span className="ai-model" key={s.service}>
                  {s.service}
                  {s.count > 1 ? ` ×${s.count}` : ""} <b>${(s.monthly * s.count).toFixed(0)}</b>
                </span>
              ))}
            </div>

            {d.aiUsage.byTool.length === 0 ? (
              <p className="ai-empty">
                아직 집계가 없습니다. 맥에서 <code>node collectors/collect-ai-usage.mjs</code>를 실행하세요.
              </p>
            ) : (
              <>
                <div className="ai-rows">
                  {d.aiUsage.byTool.map((t) => (
                    <div className="ai-row" key={t.tool}>
                      <span className="chip">
                        {t.tool}
                        {t.metered ? " · 종량제" : ""}
                      </span>
                      <span className="ai-tokens">{(t.tokens / 1_000_000).toFixed(0)}M 토큰</span>
                      <span className="ai-cost">${t.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="ai-models">
                  {d.aiUsage.topModels.map((m) => (
                    <span className="ai-model" key={`${m.tool}-${m.model}`}>
                      {m.model} <b>${m.cost.toFixed(0)}</b>
                    </span>
                  ))}
                </div>

                {d.aiUsage.topProjects.length > 0 && (
                  <>
                    <h3 className="ai-h3">프로젝트별 투입 (누적 · 정가 환산)</h3>
                    <div className="ai-rows">
                      {d.aiUsage.topProjects.map((p) => (
                        <div className="ai-row two" key={p.project}>
                          <span className="ai-proj">{p.project}</span>
                          <span className="ai-cost">${p.cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>

        <div className="col">
          <section className="card briefing">
            <h2>
              데일리 브리핑<span className="sub">{d.briefing?.brief_date ?? ""}</span>
            </h2>
            <p>{d.briefing?.summary_md ?? "브리핑이 아직 없습니다. Claude 예약 작업이 매일 아침 작성합니다."}</p>
          </section>

          <section className="card">
            <h2>최근 이벤트</h2>
            {d.events.map((e) => (
              <div className="ev" key={e.id}>
                <span className="src">{e.source}</span>
                <span className="tt">{e.title}</span>
                <span className="when">{timeAgo(e.occurred_at)}</span>
              </div>
            ))}
          </section>
        </div>
      </div>

      <p className="footer-note">
        GroundRooted · 소프트웨어 판매업 / 통신판매업 · 이 대시보드는 events / revenue / albums / projects 테이블을 읽기만 합니다 — 쓰기는 수집기(cron·웹훅·Claude)가 담당.
      </p>
    </main>
  );
}
