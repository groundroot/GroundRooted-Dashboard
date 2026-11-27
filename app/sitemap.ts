import type { MetadataRoute } from 'next';
import { getPosts, SITE_URL } from '@/lib/blog';

// 사이트의 유일한 sitemap. 로그인 없이 열리는 페이지만 싣는다. 초안은 getPosts()가 운영에서 뺀다.
const PUBLIC_PAGES = ['/', '/videokit', '/videokit/terms', '/videokit/privacy', '/price', '/pdf-to-md', '/youtube-to-md'];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  return [
    ...PUBLIC_PAGES.map(path => ({ url: `${SITE_URL}${path === '/' ? '' : path}` })),
    { url: `${SITE_URL}/blog`, lastModified: posts[0]?.date },
    ...posts.map(p => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date })),
  ];
}
