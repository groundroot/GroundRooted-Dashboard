// 클라이언트 목록(PostList)에서도 쓰므로 lib/blog(파일 읽기)는 타입만 가져온다.
import type { Post } from '@/lib/blog';

export const formatDate = (date: string) => date.replaceAll('-', '.');

export type CardPost = Pick<Post, 'slug' | 'title' | 'description' | 'date' | 'category' | 'draft' | 'image' | 'imageAlt'>;
export const toCard = ({ slug, title, description, date, category, draft, image, imageAlt }: Post): CardPost =>
  ({ slug, title, description, date, category, draft, image, imageAlt });

/** 대표 이미지가 없으면 카테고리 이름과 재생 헤드 선(/videokit 타임라인에서 왔다)으로 표지를 대신 그린다. */
export function Cover({ post, eager }: { post: CardPost; eager?: boolean }) {
  return <div className="blog-cover">
    {post.image
      ? <img src={post.image} alt={post.imageAlt ?? ''} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      : <div className="blog-cover-type" aria-hidden="true"><span>{post.category}</span></div>}
  </div>;
}

export function Meta({ post }: { post: CardPost }) {
  return <p className="blog-meta">
    <span className="blog-cat">{post.category}</span>
    <time dateTime={post.date}>{formatDate(post.date)}</time>
    {post.draft && <span className="blog-draft">초안 · 프리뷰에서만 보임</span>}
  </p>;
}

export default function PostCard({ post, lead }: { post: CardPost; lead?: boolean }) {
  return <article className={lead ? 'blog-card blog-card-lead' : 'blog-card'}>
    <a href={`/blog/${post.slug}`} className="blog-card-link">
      <Cover post={post} eager={lead} />
      <div className="blog-card-text">
        <h2>{post.title}</h2>
        {post.description && <p className="blog-card-desc">{post.description}</p>}
        <Meta post={post} />
      </div>
    </a>
  </article>;
}
