# 블로그 글 쓰는 법

`content/blog/` 안의 `.md` 파일 하나가 글 하나입니다. 이름이 `_`로 시작하는 파일(이 안내문)은 글로 읽지 않습니다.
커밋해서 배포되면 https://groundrooted.com/blog 에 나옵니다.

## 파일 맨 위 (frontmatter)

```yaml
---
title: "글 제목"
description: "목록과 검색 결과에 나오는 한두 문장 요약"
date: "2026-11-27"          # 따옴표로 감싼 YYYY-MM-DD. 최신순 정렬 기준
category: "제작 스토리"      # 아무 이름이나. 새 이름을 쓰면 목록 탭이 저절로 생긴다
slug: "making-of-something" # 주소 /blog/<slug>. 영문 소문자 · 숫자 · 하이픈. 없으면 파일 이름
draft: true                 # true면 운영에서는 목록 · 글 · 사이트맵 · RSS 어디에도 안 나온다(프리뷰에서는 '초안'으로 보임)
image: "/blog/making-of-something/cover.jpg"  # 선택. 대표 이미지(16:10 권장). 없으면 제목 표지를 그린다
imageAlt: "이미지 설명"      # 선택. image를 쓰면 함께 쓴다
cta: false                  # 선택. true면 글 끝에 클로드 비디오 키트 · 1:1 강의 안내. 기본은 꺼짐(키트와 관련 있는 글만 켠다)
instagram:                  # 선택. 인스타그램 연동 준비용
  caption: "인스타 본문 #해시태그"
  carousel: ["/blog/making-of-something/ig-01.png"]  # 1080×1350(4:5), 최대 10장
  reel: "/blog/making-of-something/reel.mp4"         # 9:16 영상
  permalinks: []            # 올라간 뒤 게시물 주소를 넣으면 글 끝에 '인스타그램에서도 볼 수 있습니다'가 나온다
---
```

title · date · category가 없거나 slug가 겹치면 빌드가 실패합니다(잘못된 글이 운영에 나가지 않도록).

## 이미지 · 영상 파일

글마다 `public/blog/<slug>/` 폴더에 둡니다. 주소는 `/blog/<slug>/파일이름` 이고 로그인 없이 열립니다
(인스타그램 API가 나중에 이 주소에서 파일을 가져갑니다).

## 본문에서 쓸 수 있는 것

- 마크다운 제목(`##`, `###`), 목록, 굵게, 링크, 인용, 표, 코드 블록
- 이미지: `![설명](/blog/<slug>/photo.jpg)`
- 유튜브: 한 줄에 유튜브 주소만 쓰면 영상으로 들어갑니다 (`https://youtu.be/...`, `https://www.youtube.com/watch?v=...`, `/shorts/...`)
- 글 맨 위 제목(`#`)은 쓰지 않습니다. title이 제목으로 나옵니다.

## 쓸 때 지킬 것

- 확인한 사실만 씁니다. 키트 기능은 키트 설명서 · 변경 기록에서, 가격은 쓰지 않고 /videokit 링크로 둡니다.
- 인스타그램 링크는 `lib/blog.ts`의 `INSTAGRAM_URL`에 계정 주소를 넣으면 블로그 위 · 아래에 나타납니다.
