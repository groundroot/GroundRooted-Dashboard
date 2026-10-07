import { type PdfSample, sampleMarkdown } from "@/products/pdf-demo";

export function DocumentPreview({ sample, compact = false }: { sample: PdfSample; compact?: boolean }) {
  const Title = compact ? "p" : "h3";
  const Subheading = compact ? "p" : "h4";
  return <article className={"gr-paper" + (compact ? " gr-paper-compact" : "")} aria-label="설명용 문서 미리보기">
    <div className="gr-paper-meta"><span>GROUNDROOTED / {sample.category}</span><span>{sample.date}</span></div>
    <div className="gr-paper-rule" /><Title className="gr-paper-title">{sample.title}</Title><p className="gr-paper-subtitle">{sample.subtitle}</p>
    <div className="gr-paper-illustration" aria-hidden="true"><i /><i /><i /><span>THINK DEEPLY.<br />KEEP GROWING.</span></div>
    <p>{sample.intro}</p><Subheading className="gr-paper-subheading">{sample.heading}</Subheading><ol>{sample.points.map(p => <li key={p}>{p}</li>)}</ol>
    <blockquote>{sample.quote}</blockquote><div className="gr-paper-bottom"><span>설명용 샘플 문서</span><span>{sample.number} / 02</span></div>
  </article>;
}
export function MarkdownPreview({ sample, rendered = false }: { sample: PdfSample; rendered?: boolean }) {
  if (rendered) return <article className="gr-reading"><h3>{sample.title.replace("\n", " ")}</h3><p>{sample.intro}</p><h4>{sample.heading}</h4><ul>{sample.points.map(p => <li key={p}>{p}</li>)}</ul><blockquote>{sample.quote}</blockquote></article>;
  return <div className="gr-code" aria-label="Markdown 원문"><pre><code>{sampleMarkdown(sample).split("\n").map((line, index) => <span className={line.startsWith("#") ? "gr-code-heading" : line.startsWith(">") ? "gr-code-quote" : ""} key={index}><i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>{line || " "}{"\n"}</span>)}</code></pre></div>;
}
