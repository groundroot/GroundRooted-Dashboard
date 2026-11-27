import { getPosts, SITE_URL } from '@/lib/blog';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const items = getPosts().map(p => {
    const url = `${SITE_URL}/blog/${p.slug}`;
    return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>` +
      `<pubDate>${new Date(`${p.date}T09:00:00+09:00`).toUTCString()}</pubDate><category>${esc(p.category)}</category>` +
      `<description>${esc(p.description)}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>` +
    `<title>그라운드루티드 블로그</title><link>${SITE_URL}/blog</link><description>그라운드루티드가 영상을 만들고, 도구를 만들고, 그 과정에서 겪은 이야기를 씁니다.</description>` +
    `<language>ko</language><atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
