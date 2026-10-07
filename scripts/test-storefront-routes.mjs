import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { authToken } from '../lib/auth.ts';
import { editorialPublicPaths, paperMotionPath } from '../products/editorial-media.ts';

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
    if(path==='/') for(const href of ['/pdf-to-md','/youtube-to-md','https://groundroot.github.io/typecut-pro/']) assert.ok(html.includes(`href="${href}"`));
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
