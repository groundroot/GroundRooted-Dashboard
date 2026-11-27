import type { MetadataRoute } from 'next';
import { getPosts, SITE_URL } from '@/lib/blog';

// 공개된 페이지만 싣는다. 나머지 경로는 로그인 뒤에 있다. 초안은 getPosts()가 운영에서 뺀다.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  return [
    { url: `${SITE_URL}/videokit` },
    { url: `${SITE_URL}/blog`, lastModified: posts[0]?.date },
    ...posts.map(p => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date })),
  ];
}
