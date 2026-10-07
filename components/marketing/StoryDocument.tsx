import { readingStory as story } from "@/products/readymd-story";

/** Authored sample, shared between the fixed page and the reflowing reader. */
export default function StoryDocument({ compact = false }: { compact?: boolean }) {
  const Heading = compact ? "strong" : "h4";
  return <div className={compact ? "rm-document rm-document-small" : "rm-document"}>
    <span className="rm-document-label">READING NOTE <span>01</span></span>
    <Heading>{story.title}</Heading>
    <p className="rm-document-subtitle">{story.subtitle}</p>
    <p>{story.intro}</p>
    <div className="rm-document-body"><strong>{story.heading}</strong>{story.paragraphs.map(text => <p key={text}>{text}</p>)}</div>
    <figure><img src={story.image} alt="읽기, 메모, 연결로 이어지는 세 단계" width={720} height={300} loading="lazy" decoding="async" /><figcaption>{story.caption}</figcaption></figure>
  </div>;
}
