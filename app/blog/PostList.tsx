'use client';
import { useSearchParams } from 'next/navigation';
import PostCard, { type CardPost } from './PostCard';

/**
 * /blog?category=제작 스토리 처럼 카테고리로 거른다. 페이지는 정적으로 만들어 두고 거르기만 브라우저에서 한다.
 * 카테고리 목록은 글에서 모은다 — 새 category 값을 쓰면 탭이 저절로 생긴다.
 */
export function PostList({ posts, categories, active }: { posts: CardPost[]; categories: string[]; active?: string }) {
  const current = active && categories.includes(active) ? active : undefined;
  const shown = current ? posts.filter(p => p.category === current) : posts;
  return <>
    {categories.length > 1 && <nav className="blog-tabs" aria-label="카테고리">
      <a href="/blog" aria-current={!current ? 'page' : undefined}>전체</a>
      {categories.map(c => <a key={c} href={`/blog?category=${encodeURIComponent(c)}`} aria-current={current === c ? 'page' : undefined}>{c}</a>)}
    </nav>}
    {shown.length === 0
      ? <p className="blog-empty">아직 올라온 글이 없습니다. 첫 글을 준비하고 있습니다.</p>
      : <div className="blog-grid">{shown.map((p, i) => <PostCard key={p.slug} post={p} lead={i === 0} />)}</div>}
  </>;
}

export default function FilteredPostList(props: { posts: CardPost[]; categories: string[] }) {
  const category = useSearchParams().get('category') ?? undefined;
  return <PostList {...props} active={category} />;
}
