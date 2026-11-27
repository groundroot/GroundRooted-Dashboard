import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPost, getPosts, getRelated, renderMarkdown, type Post } from '@/lib/blog';
import PostCard, { Cover, Meta, toCard } from '../PostCard';

export const dynamicParams = false;
export const generateStaticParams = () => getPosts().map(p => ({ slug: p.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description || undefined,
    alternates: { canonical: url },
    // 프리뷰에서만 보이는 초안은 색인하지 않는다.
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article', url, title: post.title, description: post.description || undefined,
      publishedTime: post.date, section: post.category,
      images: post.image ? [{ url: post.image, alt: post.imageAlt ?? post.title }] : undefined,
    },
  };
}

// 글 끝 안내는 frontmatter에 cta: true 인 글에만 붙는다(기본은 꺼짐).
function KitCta() {
  return <aside className="blog-cta" aria-label="클로드 비디오 키트 안내">
    <div className="blog-cta-grid">
      <div>
        <h3>클로드 비디오 키트</h3>
        <p>영상 제작은 클로드에게 맡기고 검수는 편집 프로그램에서 하도록 만든 키트입니다. 키트 파일과 사용 설명 eBook을 받아 직접 설치합니다.</p>
        <p className="blog-cta-links"><a className="blog-btn" href="/price?plan=kit">결제하기</a><a href="/videokit">키트 소개 보기</a></p>
      </div>
      <div>
        <h3>키트 + 1:1 강의</h3>
        <p>클로드 코드가 처음이라면 사용법부터 배우고, 키트 설치는 원격으로 함께 진행합니다. 일정은 개별로 조율합니다.</p>
        <p className="blog-cta-links"><a className="blog-btn blog-btn-quiet" href="/price?plan=lesson">강의 포함 상품 보기</a></p>
      </div>
    </div>
  </aside>;
}

// 인스타그램에 올라간 게시물 링크(permalinks)가 있을 때만 보인다. 외부 스크립트 없이 링크로만 연결한다.
function InstagramPosts({ post }: { post: Post }) {
  const ig = post.instagram;
  if (!ig?.permalinks.length) return null;
  const thumb = ig.carousel[0];
  return <section className="blog-ig" aria-label="인스타그램 게시물">
    <h2>인스타그램에서도 볼 수 있습니다</h2>
    <ul>
      {ig.permalinks.map((href, i) => <li key={href}>
        <a href={href} target="_blank" rel="noopener">
          {thumb && i === 0 && <img src={thumb} alt="" loading="lazy" decoding="async" />}
          <span>{ig.permalinks.length > 1 ? `게시물 ${i + 1} 보기` : '게시물 보기'}</span>
        </a>
      </li>)}
    </ul>
  </section>;
}

export default async function BlogPost({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const related = getRelated(post);
  return <article className="blog-post">
    <header className="blog-wrap blog-post-head">
      <h1>{post.title}</h1>
      {post.description && <p className="blog-post-desc">{post.description}</p>}
      <Meta post={toCard(post)} />
    </header>
    {post.image && <div className="blog-wrap blog-post-cover"><Cover post={toCard(post)} eager /></div>}
    <div className="blog-wrap">
      <div className="blog-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
      <InstagramPosts post={post} />
      {post.cta && <KitCta />}
    </div>
    {related.length > 0 && <section className="blog-wrap blog-related" aria-labelledby="related-title">
      <h2 id="related-title">다른 글</h2>
      <div className="blog-grid blog-grid-small">{related.map(p => <PostCard key={p.slug} post={toCard(p)} />)}</div>
      <p><a href="/blog">글 목록으로</a></p>
    </section>}
  </article>;
}
