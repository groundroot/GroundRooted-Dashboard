import { Suspense } from 'react';
import { getCategories, getPosts } from '@/lib/blog';
import { toCard } from './PostCard';
import FilteredPostList, { PostList } from './PostList';

export const metadata = {
  title: { absolute: '그라운드루티드 블로그' },
  alternates: { canonical: '/blog' },
  openGraph: { title: '그라운드루티드 블로그', url: '/blog' },
};

export default function BlogIndex() {
  const posts = getPosts().map(toCard);
  const categories = getCategories();
  return <div className="blog-wrap blog-index">
    <header className="blog-intro">
      <h1>그라운드루티드 블로그</h1>
      <p>영상을 만들고, 그 영상을 만드는 도구를 만들면서 겪은 일을 씁니다. 제작 과정, 화제가 된 콘텐츠, 업데이트 소식을 차례로 올립니다.</p>
    </header>
    {/* 자바스크립트 전에는 전체 목록을 보여 주고, 주소에 category가 있으면 그 카테고리만 남긴다. */}
    <Suspense fallback={<PostList posts={posts} categories={categories} />}>
      <FilteredPostList posts={posts} categories={categories} />
    </Suspense>
  </div>;
}
