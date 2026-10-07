// Browser-level checks for generated artwork and purposeful interactions.
// Supply the task's existing Ego space; this script never creates another space.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const config = { space: Number(process.argv[2]), baseURL: process.argv[3] || 'http://127.0.0.1:3045', output: resolve(process.argv.find(arg => arg.startsWith('--output='))?.slice(9) || 'output/playwright/editorial-upgrade'), axe: readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf8') };
if (!config.space) throw new Error('Pass the existing Ego task space ID.');
mkdirSync(config.output, { recursive: true });
async function verify(config) {
  const fs = await import('node:fs/promises');
  const task = await taskSpace(config.space);
  const page = task.page('p1');
  // Ego's pointer overlay briefly hides the tab before ordinary click(), which
  // intentionally pauses our media. Dispatch a trusted CDP click for media
  // controls to test the button without changing page visibility first.
  async function clickMotion(selector) {
    const point = await page.evaluate(selector => {
      const button = document.querySelector(selector);
      button.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rect = button.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }, selector);
    await page.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await page.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  }
  const checks=[];
  function check(name, passed, detail=null) { checks.push({name,passed,detail}); console.log(passed?'PASS':'FAIL',name,passed?'':JSON.stringify(detail)); }
  const viewport=width=>page.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  try {
    await viewport(1440);
    await page.goto(config.baseURL);
    await page.waitForSelector('loc=css:.gs-hero-visual.gr-work-explorer');
    console.log(await page.snapshot());
    check('no initial video download', await page.evaluate(()=> !document.querySelector('video').getAttribute('src') && !performance.getEntriesByType('resource').some(r=>r.name.endsWith('.mp4'))));
    await clickMotion('.gs-hero-visual .gr-scene-control');
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.15);
    check('manual video playback',await page.evaluate(()=>!document.querySelector('video').paused && document.querySelector('video').muted && document.querySelector('.gr-scene-control').getAttribute('aria-pressed')==='true'));
    await clickMotion('.gs-hero-visual .gr-scene-control');
    await page.waitForFunction(()=>document.querySelector('video').paused && document.querySelector('.gr-scene-control').getAttribute('aria-pressed')==='false');
    check('video pause button',await page.evaluate(()=>document.querySelector('video').paused && document.querySelector('.gr-scene-control').getAttribute('aria-pressed')==='false'));
    await clickMotion('.gs-hero-visual .gr-scene-control');
    await page.waitForFunction(()=>!document.querySelector('video').paused);
    await page.evaluate(()=>document.getElementById('guide').scrollIntoView());
    await page.waitForFunction(()=>document.querySelector('video').paused);
    check('offscreen video pauses',await page.evaluate(()=>document.querySelector('.gr-scene-control').getAttribute('aria-pressed')==='false'));
    check('scroll reading progress',await page.evaluate(()=>document.querySelector('progress').value>0));
    await page.evaluate(()=>scrollTo(0,0));
    await page.click('loc=css:.gs-hero-visual .gr-work-tabs button:first-child');
    await page.press('loc=css:.gs-hero-visual .gr-work-tabs button:first-child','End');
    check('hero End selects editing and focuses tab',await page.evaluate(()=>document.activeElement.textContent==='편집' && document.activeElement.getAttribute('aria-selected')==='true' && document.querySelector('.gs-hero-visual [role=tabpanel]:not([hidden]) a').href==='https://groundroot.github.io/typecut-pro/'));
    await page.press('loc=css:.gs-hero-visual .gr-work-tabs button:last-child','ArrowRight');
    check('hero keyboard wraps to reading',await page.evaluate(()=>document.activeElement.textContent==='읽기' && document.activeElement.getAttribute('aria-selected')==='true'));
    // Simulate a failed local media response, then exercise the real retry action.
    await page.evaluate(()=>{ const v=document.querySelector('video');v.src='/media/editorial-v1/does-not-exist.mp4';v.load(); });
    await page.waitForFunction(()=>document.querySelector('.gr-motion-status').textContent.includes('이미지'));
    check('video error keeps still image and retry',await page.evaluate(()=>document.querySelector('.gr-scene-control').textContent==='다시 재생' && !document.querySelector('video').classList.contains('gr-motion-visible')));
    await clickMotion('.gs-hero-visual .gr-scene-control');
    await page.waitForFunction(()=>!document.querySelector('video').paused && document.querySelector('video').currentTime>.15);
    check('video retry recovers',true);
    await clickMotion('.gs-hero-visual .gr-scene-control');
    await page.click('loc=css:.gs-readymd .gr-stage-buttons button:last-child');
    check('product result stage',await page.evaluate(()=>document.querySelector('.gs-readymd .gr-stage-result').textContent.includes('Markdown') && document.querySelector('.gs-readymd .gr-stage-buttons button:last-child').getAttribute('aria-pressed')==='true'));
    await page.click('loc=css:.gr-work-guide .gr-work-tabs button:nth-child(2) span');
    check('guide selects transcript and correct link',await page.evaluate(()=>document.querySelector('.gr-work-guide [role=tabpanel]:not([hidden]) a').getAttribute('href')==='/youtube-to-md'));
    await page.evaluate(config.axe+'\ntrue;');
    const result=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
    check('interactive home state axe',!result.length,result);
    await viewport(320);
    for (let i=1;i<=3;i++) {
      await page.click(`loc=css:.gs-hero-visual .gr-work-tabs button:nth-child(${i})`);
      check(`320px hero scene ${i} fits`,await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
      await page.click(`loc=css:.gr-work-guide .gr-work-tabs button:nth-child(${i}) span`);
      check(`320px guide scene ${i} fits`,await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
    }
    await viewport(1440);
    for (let i=0; i<await page.evaluate(()=>document.images.length); i++) {
      await page.evaluate(index=>document.images[index].scrollIntoView({block:'center'}),i);
      await page.waitForFunction(index=>document.images[index].complete && document.images[index].naturalWidth>0,i);
    }
    check('all home artwork loads after scrolling',true);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:config.output+'/home-desktop.png',fullPage:true});
    await viewport(390);
    await page.screenshot({path:config.output+'/home-mobile.png',fullPage:true});
    await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await page.goto(config.baseURL);
    check('reduced motion starts static',await page.evaluate(()=>!document.querySelector('video').getAttribute('src') && getComputedStyle(document.querySelector('.gs-hero-visual img')).animationName==='none'));
    await page.goto(config.baseURL+'/pdf-to-md');
    await page.waitForSelector('loc=css:.gr-reading-story');
    await page.click('loc=css:.gr-reading-story .gr-stage-buttons button:last-child');
    check('ReadyMD reuse choice',await page.evaluate(()=>document.querySelector('.gr-reading-story-result').textContent.includes('Markdown')));
    await clickMotion('.gr-reading-story .gr-scene-control');
    await page.waitForFunction(()=>document.querySelector('.gr-reading-story video').currentTime>.1);
    check('ReadyMD manual video works with reduced motion',true);
    await clickMotion('.gr-reading-story .gr-scene-control');
    await page.evaluate(()=>document.querySelector('.gr-reading-story').scrollIntoView({block:'center'}));
    await page.waitForFunction(()=>document.querySelector('.gr-reading-story video').paused);
    check('ReadyMD pause control', true);
    await page.screenshot({path:config.output+'/readymd-media-mobile.png'});
    await viewport(1440);
    await page.evaluate(()=>document.querySelector('.gr-reading-story').scrollIntoView({block:'center'}));
    await page.screenshot({path:config.output+'/readymd-media-desktop.png'});
  } finally {
    await page.cdp('Emulation.setEmulatedMedia',{features:[]});
    await fs.writeFile(config.output+'/results.json',JSON.stringify(checks,null,2));
  }
  if(checks.some(c=>!c.passed)) throw new Error('Editorial UI checks failed');
  console.log(`PASS: ${checks.length} editorial checks.`);
}
const child=spawn('ego-browser',['nodejs'],{stdio:['pipe','inherit','inherit']});
child.stdin.end(`(${verify.toString()})(${JSON.stringify(config)}).catch(error=>{console.error(error);process.exitCode=1;});`);
child.on('exit',code=>process.exitCode=code ?? 1);
