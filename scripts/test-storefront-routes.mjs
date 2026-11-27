import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { authToken } from '../lib/auth.ts';
import { editorialPublicPaths, paperMotionPath } from '../products/editorial-media.ts';
import { priceOf, tierAt } from '../products/videokit.ts';
const won = n => `${new Intl.NumberFormat('ko-KR').format(n)}원`;

async function withServer({ port, password, preview }, run) {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: { ...process.env, NODE_ENV: 'production', DASHBOARD_PASSWORD: password, MARKETING_PREVIEW_ENABLED: String(preview) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Test server did not start')), 15000);
      server.on('error', reject);
      server.on('exit', code => { if (!ready) { clearTimeout(timer); reject(new Error(`Test server exited ${code}`)); } });
      server.stdout.on('data', chunk => { if (chunk.toString().includes('Ready in')) { ready = true; clearTimeout(timer); resolve(); } });
      server.stderr.on('data', () => {});
    });
    await run(async (path, cookie) => fetch(`http://127.0.0.1:${port}${path}`, { redirect: 'manual', headers: cookie ? { cookie } : {} }));
  } finally {
    if (server.exitCode === null) { server.kill('SIGTERM'); const killTimer = setTimeout(() => server.kill('SIGKILL'), 3000); await new Promise(resolve => server.once('exit',resolve)); clearTimeout(killTimer); }
  }
}
const password = randomBytes(24).toString('hex');
await withServer({port:3035,password,preview:true}, async request => {
  for (const path of ['/', '/pdf-to-md', '/youtube-to-md']) {
    const r = await request(path); assert.equal(r.status,200,path); assert.match(r.headers.get('x-robots-tag'),/noindex/);
    const html=await r.text(); assert.ok(!html.includes('오늘 매출') && !html.includes('AI 에이전트 비용'), `HQ data in ${path}`);
    if(path==='/') for(const href of ['/pdf-to-md','/youtube-to-md','https://groundroot.github.io/typecut-pro/','/videokit','/price?plan=kit','/price?plan=lesson','/price?plan=pass']) assert.ok(html.includes(`href="${href}"`));
    if(path==='/') for(const plan of ['kit','lesson','pass']) assert.ok(html.includes(`src="/videokit/plan-${plan}.png"`), `home thumb ${plan}`);
  }
  for (const [path, text] of [['/videokit/terms', '이용약관'], ['/videokit/privacy', '개인정보처리방침'], ['/price', '상품 선택'], ['/price', won(priceOf('kit', tierAt()))], ['/price?plan=kit', won(priceOf('kit', tierAt()))], ['/price?plan=lesson', won(priceOf('lesson', tierAt()))], ['/price?plan=pass', '1:1 강의권 2회'], ['/price?plan=toString', '상품 선택'], ['/price?plan=kit', '계좌이체'], ['/price?plan=kit', '1002-8619-7757'], ['/price?plan=kit', '환불'], ['/price/fail?code=PAY_PROCESS_CANCELED', '결제를 취소했습니다'], ['/price/success', '결제를 확인하지 못했습니다'], ['/price/success?orderId=vk-kit-x&amount=1&paymentKey=p', '결제를 확인하지 못했습니다'], ['/price/success?orderId=vk-kit-s-00000000-0000-0000-0000-000000000000&amount=100000&paymentKey=p', '결제를 확인하지 못했습니다']]) {
    const r = await request(path); assert.equal(r.status, 200, path); assert.ok((await r.text()).includes(text), `${path} should include ${text}`);
  }
  for (const path of ['/price/other', '/videokit/secret.html', '/videokit/instructor']) { const r = await request(path); assert.equal(r.status, 307, path); }
  for (const path of ['/videokit', '/videokit/diagram.html']) {
    const r = await request(path); assert.equal(r.status, 200, path); assert.match(r.headers.get('content-type'), /text\/html/);
    if (path === '/videokit') { const html = await r.text(); assert.ok(html.includes('src="/videokit/diagram.html"')); assert.ok(html.includes('open.kakao.com')); for (const plan of ['kit', 'lesson', 'pass']) assert.ok(html.includes(`href="/price?plan=${plan}"`), `buy button ${plan}`); assert.ok(!html.includes('신청서 작성')); }
  }
  // 상품별 이미지(키트 · 키트 + 강의 · 강의권)는 공개 경로여야 한다. 막히면 307로 이미지가 깨진다.
  for (const path of ['/videokit/product.png', '/videokit/plan-kit.png', '/videokit/plan-lesson.png', '/videokit/plan-pass.png']) {
    const r = await request(path); assert.equal(r.status, 200, path); assert.match(r.headers.get('content-type'), /image\/png/, path);
  }
  // 상품 박스 · 편집 프로그램 카드의 편집툴 아이콘도 공개 경로여야 한다.
  for (const path of ['/videokit/logos/claude.svg', '/videokit/logos/final-cut-pro.png', '/videokit/logos/capcut.svg', '/videokit/logos/davinci-resolve.svg', '/videokit/logos/premiere-pro.svg', '/videokit/logos/filmcraft.png']) {
    const r = await request(path); assert.equal(r.status, 200, path); assert.match(r.headers.get('content-type'), /^image\//, path);
  }
  // 키트 업데이트 확인은 로그인 없이 열려 있고, 키가 없으면 401(발송 설정이 없으면 503)
  { const r = await request('/api/videokit/latest?platform=mac'); assert.ok([401, 503].includes(r.status), `latest ${r.status}`); assert.ok((await r.json()).error); }
  // 키트 짧은 다운로드 링크는 로그인 없이 열린다. 형식이 틀린 코드 = 만료 페이지(404), 형식이 맞으면 DB 조회(설정이 없으면 '잠시 후 다시')
  { const r = await request('/d/0000OOOO'); assert.equal(r.status, 404); assert.match(r.headers.get('x-robots-tag'), /noindex/); assert.ok((await r.text()).includes('링크가 만료되었습니다')); }
  { const r = await request('/d/ABCD2345'); assert.ok([200, 404].includes(r.status), `/d ${r.status}`); assert.match(await r.text(), /잠시 후 다시 열어 주세요|링크가 만료되었습니다|키트 내려받기/); }
  // 버튼은 POST 폼. GET(메일 검사기 · 미리보기)은 세지 않고 페이지로 303
  { const r = await request('/d/abcd2345/mac'); assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/d/ABCD2345'); }
  { const r = await fetch('http://127.0.0.1:3035/d/ABCD2345/mac', { method: 'POST', redirect: 'manual' }); assert.ok([303, 503].includes(r.status), `POST /d/mac ${r.status}`); }
  { const r = await request('/d/ABCD2345'); assert.ok((await r.text()).match(/잠시 후 다시 열어 주세요|링크가 만료되었습니다|method="post"/)); }
  for (const path of ['/d/ABCD2345/linux', '/d/ABCD2345/mac/x', '/d']) { const r = await request(path); assert.equal(r.status, 307, path); }
  // 공개 블로그: 로그인 없이 열리고 색인을 허용한다. 운영(next start, VERCEL_ENV 없음)에서 초안은 목록 · 글 · 사이트맵 · RSS 어디에도 없다.
  {
    const r = await request('/blog'); assert.equal(r.status, 200, '/blog'); assert.equal(r.headers.get('x-robots-tag'), null, '/blog robots header');
    const html = await r.text(); assert.match(html, /<meta name="robots" content="index, follow"/); assert.ok(html.includes('그라운드루티드 블로그'));
    const sitemap = await request('/sitemap.xml'); assert.equal(sitemap.status, 200); const sitemapXml = await sitemap.text(); assert.ok(sitemapXml.includes('https://groundrooted.com/blog</loc>'));
    const rss = await request('/blog/rss.xml'); assert.equal(rss.status, 200); assert.match(rss.headers.get('content-type'), /rss\+xml/); const rssXml = await rss.text();
    const robots = await request('/robots.txt'); assert.equal(robots.status, 200); assert.ok((await robots.text()).includes('Sitemap: https://groundrooted.com/sitemap.xml'));
    for (const file of readdirSync('content/blog').filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
      const fm = readFileSync(`content/blog/${file}`, 'utf8').split(/^---$/m)[1];
      const slug = fm.match(/^slug:\s*"?([a-z0-9-]+)"?/m)?.[1] ?? file.replace(/\.md$/, '');
      const draft = /^draft:\s*true\s*$/m.test(fm);
      const post = await request(`/blog/${slug}`); assert.equal(post.status, draft ? 404 : 200, `/blog/${slug}`);
      if (!draft) assert.match(await post.text(), /<meta name="robots" content="index, follow"/, `/blog/${slug} robots`);
      for (const [where, text] of [['/blog', html], ['sitemap', sitemapXml], ['rss', rssXml]]) assert.equal(text.includes(`/blog/${slug}`), !draft, `${slug} in ${where}`);
    }
    for (const path of ['/blogx', '/blog-admin']) { const x = await request(path); assert.equal(x.status, 307, path); }
  }
  const typecut = await request('/typecut-pro');
  assert.equal(typecut.status,307);
  assert.equal(typecut.headers.get('location'),'https://groundroot.github.io/typecut-pro/');
  for (const path of [...editorialPublicPaths, paperMotionPath]) {
    const asset = await request(path);
    assert.equal(asset.status, 200, path);
    assert.match(asset.headers.get('content-type'), path.endsWith('.mp4') ? /video\/mp4/ : /image\/webp/);
  }
  for (const path of ['/admin/hq','/admin/hq?x=1','/pdf-to-md/private','/youtube-to-md/private','/media/editorial-v1/private','/media/private.png','/unknown']) {
    for (const cookie of [undefined,'hq_auth=invalid']) { const r=await request(path,cookie); assert.equal(r.status,307,path); assert.equal(new URL(r.headers.get('location'), 'http://127.0.0.1').pathname,'/login'); }
  }
  // Valid cookie must pass the gate; use a missing admin route to avoid reading HQ data.
  const allowed=await request('/admin/auth-probe',`hq_auth=${await authToken(password)}`);
  assert.equal(allowed.status,404);
  assert.match(allowed.headers.get('cache-control'),/no-store/);
});
await withServer({port:3036,password:'',preview:true}, async request => {
  assert.equal((await request('/')).status,200);
  assert.equal((await request('/admin/hq')).status,500);
});
await withServer({port:3037,password,preview:false}, async request => {
  assert.equal((await request('/')).status,307);
  assert.equal((await request('/youtube-to-md')).status,307);
});
console.log('PASS: storefront allowlist, no HQ content, invalid/missing/valid auth, fail-closed config, preview gate.');
