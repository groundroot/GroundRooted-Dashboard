"use client";

import { useMemo, useRef, useState } from "react";
import type { RevenuePoint } from "@/lib/data";

const W = 720;
const H = 200;
const PAD = { top: 14, right: 12, bottom: 22, left: 40 };

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { pts, max, ticks } = useMemo(() => {
    const max = Math.max(10, ...data.map((d) => d.amount));
    const niceMax = Math.ceil(max / 20) * 20;
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const pts = data.map((d, i) => ({
      x: PAD.left + (i / Math.max(1, data.length - 1)) * iw,
      y: PAD.top + ih - (d.amount / niceMax) * ih,
      ...d,
    }));
    const ticks = [0, 0.5, 1].map((f) => ({
      y: PAD.top + ih - f * ih,
      v: Math.round(niceMax * f),
    }));
    return { pts, max: niceMax, ticks };
  }, [data]);

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - PAD.bottom} L${pts[0].x.toFixed(1)},${H - PAD.bottom} Z`;

  const maxPt = pts.reduce((a, b) => (b.amount > a.amount ? b : a), pts[0]);
  const hoverPt = hover != null ? pts[hover] : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bd = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bd) { bd = d; best = i; }
    });
    setHover(best);
  }

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        role="img"
        aria-label={`최근 30일 일별 매출, 최대 $${max}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t.v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="var(--grid)" strokeWidth={1} />
            <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
              ${t.v}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--baseline)" strokeWidth={1} />
        {[0, Math.floor(pts.length / 2), pts.length - 1].map((i, j) => (
          <text
            key={i}
            x={pts[i].x}
            y={H - 6}
            textAnchor={j === 0 ? "start" : j === 2 ? "end" : "middle"}
            fontSize={11}
            fill="var(--text-muted)"
          >
            {pts[i].date.slice(5).replace("-", "/")}
          </text>
        ))}
        <path d={area} fill="var(--series-1)" opacity={0.12} />
        <path d={line} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* 최고점 직접 라벨 */}
        <circle cx={maxPt.x} cy={maxPt.y} r={4} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
        <text x={maxPt.x} y={maxPt.y - 9} textAnchor="middle" fontSize={11} fill="var(--text-secondary)">
          ${maxPt.amount.toFixed(0)}
        </text>
        {hoverPt && (
          <g>
            <line x1={hoverPt.x} x2={hoverPt.x} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--baseline)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={hoverPt.x} cy={hoverPt.y} r={5} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hoverPt && (
        <div
          className="chart-tip"
          style={{ left: `${(hoverPt.x / W) * 100}%`, top: `${(hoverPt.y / H) * 100}%` }}
        >
          <span className="d">{hoverPt.date.slice(5).replace("-", "/")}</span>{" "}
          <b>${hoverPt.amount.toFixed(2)}</b>
        </div>
      )}
    </div>
  );
}
