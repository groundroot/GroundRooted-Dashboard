import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import { parse as parseYaml } from 'yaml';

// 블로그 글은 content/blog/*.md 하나가 글 하나다. 작성법은 content/blog/_README.md.
// 글 목록 · 상세 · 사이트맵 · RSS · '다른 글'이 모두 getPosts()를 거쳐야 초안이 새지 않는다.

export const SITE_URL = 'https://groundrooted.com';
// 인스타그램 계정이 생기면 주소를 넣는다. 비어 있으면 블로그 헤더 · 푸터에서 링크를 숨긴다.
export const INSTAGRAM_URL = '';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

export type Instagram = { caption?: string; carousel: string[]; reel?: string; permalinks: string[] };
export type Post = {
  slug: string; title: string; description: string; date: string; category: string;
  draft: boolean; image?: string; imageAlt?: string; cta: boolean; instagram?: Instagram;
  body: string;
};

// 초안은 로컬 개발과 Vercel 프리뷰에서만 보인다. 그 밖(운영 · 로컬 next start)은 숨긴다.
export const showDrafts = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';

const fail = (file: string, msg: string): never => { throw new Error(`content/blog/${file}: ${msg}`); };
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strList = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

function parseFile(file: string): Post {
  const raw = readFileSync(path.join(CONTENT_DIR, file), 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) fail(file, '맨 위에 --- 로 감싼 frontmatter가 필요합니다');
  const fm = (parseYaml(m![1]) ?? {}) as Record<string, unknown>;
  const title = str(fm.title);
  const date = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : str(fm.date);
  const slug = str(fm.slug) || file.replace(/\.md$/, '');
  const category = str(fm.category);
  if (!title) fail(file, 'title이 없습니다');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(file, 'date는 "2026-11-27" 형식이어야 합니다');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(file, 'slug는 영문 소문자 · 숫자 · 하이픈만 씁니다');
  if (!category) fail(file, 'category가 없습니다');
  for (const key of ['draft', 'cta'] as const) if (fm[key] !== undefined && typeof fm[key] !== 'boolean') fail(file, `${key}는 따옴표 없이 true 또는 false로 씁니다`);
  const ig = fm.instagram as Record<string, unknown> | undefined;
  const carousel = strList(ig?.carousel);
  if (carousel.length > 10) fail(file, 'instagram.carousel은 최대 10장입니다');
  return {
    slug, title, date, category,
    description: str(fm.description),
    draft: fm.draft === true,
    image: str(fm.image) || undefined,
    imageAlt: str(fm.imageAlt) || undefined,
    cta: fm.cta === true,
    instagram: ig ? { caption: str(ig.caption) || undefined, carousel, reel: str(ig.reel) || undefined, permalinks: strList(ig.permalinks) } : undefined,
    body: m![2],
  };
}

let cache: Post[] | undefined;
function allPosts(): Post[] {
  if (cache) return cache;
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
  const posts = files.map(parseFile);
  const seen = new Set<string>();
  for (const p of posts) { if (seen.has(p.slug)) throw new Error(`content/blog: slug "${p.slug}"가 겹칩니다`); seen.add(p.slug); }
  posts.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, 'ko') : a.date < b.date ? 1 : -1));
  // 로컬 개발에서는 글을 고치면 바로 보이도록 매번 다시 읽는다.
  if (process.env.NODE_ENV !== 'development') cache = posts;
  return posts;
}

/** 최신순. 운영에서는 draft: true 글을 뺀다. */
export const getPosts = () => allPosts().filter(p => showDrafts || !p.draft);
export const getPost = (slug: string) => getPosts().find(p => p.slug === slug);

/** 글에 쓰인 카테고리. 글이 많은 순, 같으면 최근 글이 있는 순. */
export function getCategories(posts = getPosts()) {
  const count = new Map<string, number>();
  for (const p of posts) count.set(p.category, (count.get(p.category) ?? 0) + 1);
  return [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!);
}

/** 글 끝 '다른 글': 같은 카테고리 최근 글, 모자라면 다른 최근 글로 채운다. */
export function getRelated(post: Post, n = 3) {
  const others = getPosts().filter(p => p.slug !== post.slug);
  const same = others.filter(p => p.category === post.category);
  return [...same, ...others.filter(p => p.category !== post.category)].slice(0, n);
}

// 혼자 한 줄에 있는 유튜브 주소는 영상으로 넣는다.
const YT = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})\S*$/;
const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const marked = new Marked({ gfm: true });
marked.use({
  renderer: {
    paragraph(token) {
      const id = token.text.trim().match(YT)?.[1];
      if (id) return `<div class="blog-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube 영상" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>\n`;
      return false;
    },
    image({ href, title, text }) {
      const t = title ? ` title="${attr(title)}"` : '';
      return `<img src="${attr(href)}" alt="${attr(text)}"${t} loading="lazy" decoding="async">`;
    },
  },
});

export const renderMarkdown = (md: string) => marked.parse(md, { async: false }) as string;
