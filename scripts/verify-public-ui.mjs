// Run with Node 24 and the installed ego-browser CLI. Uses a dedicated task space unless --space=N is supplied.
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const baseURL = process.argv[2] || 'http://127.0.0.1:3045';
const spaceArg = process.argv.find((arg) => arg.startsWith('--space='));
const output = resolve(process.argv.find(arg => arg.startsWith('--output='))?.slice(9) || 'output/playwright/enterprise-upgrade');
mkdirSync(output, { recursive: true });
const config = {
  baseURL,
  space: spaceArg ? Number(spaceArg.split('=')[1]) : null,
  output,
  axe: readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf8'),
};

async function verify(config) {
  const fs = await import('node:fs/promises');
  const task = await taskSpace(config.space ?? 'GroundRooted public UI verification');
  const page = task.page('p1');
  const checks = [];
  const record = (name, passed, detail = null) => {
    checks.push({ name, passed, detail });
    console.log(passed ? 'PASS' : 'FAIL', name, passed ? '' : JSON.stringify(detail));
  };
  const viewport = (width) =>
    page.cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
  try {
    for (const [path, name] of [
      ['/', 'home'],
      ['/youtube-to-md', 'youtube'],
      ['/pdf-to-md', 'readymd'],
    ]) {
      await viewport(390);
      await page.goto(config.baseURL + path);
      await page.waitForSelector('loc=css:h1');
      for (const width of [320, 390, 768, 1024, 1440]) {
        await viewport(width);
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          headings: document.querySelectorAll('h1').length,
          brokenImages: [...document.images]
            .filter((img) => img.complete && !img.naturalWidth)
            .map((img) => img.src),
          missingAnchors: [...document.querySelectorAll('a[href^="#"]')]
            .map((a) => a.getAttribute('href').slice(1))
            .filter((id) => id && !document.getElementById(id)),
        }));
        record(
          `${name} ${width}px layout`,
          !layout.overflow &&
            layout.headings === 1 &&
            !layout.brokenImages.length &&
            !layout.missingAnchors.length,
          layout,
        );
        if (width === 390 || width === 1440) {
          await page.evaluate(config.axe + '\ntrue;');
          const violations = await page.evaluate(async () => {
            const result = await axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            });
            return result.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              targets: v.nodes.map((n) => n.target),
            }));
          });
          record(`${name} ${width}px axe`, !violations.length, violations);
          await page.screenshot({
            path: `${config.output}/${name}-${width}.png`,
            fullPage: name !== 'readymd',
          });
        }
      }
    }
    await viewport(390);
    await page.goto(config.baseURL + '/youtube-to-md');
    await page.snapshot();
    await page.click('loc=css:.site-mobile-menu summary');
    record(
      'mobile menu opens',
      await page.evaluate(() => document.querySelector('.site-mobile-menu').open),
    );
    await page.press('loc=css:.site-mobile-menu summary', 'Escape');
    record(
      'menu Escape restores focus',
      await page.evaluate(
        () =>
          !document.querySelector('.site-mobile-menu').open &&
          document.activeElement.matches('.site-mobile-menu summary'),
      ),
    );
    await page.click('loc=role:tab[name="Markdown 파일"]');
    await page.press('loc=role:tab[name="Markdown 파일"]', 'Home');
    record(
      'tab Home key',
      await page.evaluate(() => document.activeElement.textContent.includes('자막 원문')),
    );
    await page.press('loc=role:tab[name="자막 원문"]', 'ArrowRight');
    record(
      'tab ArrowRight key',
      await page.evaluate(() => document.activeElement.textContent.includes('Markdown 파일')),
    );
    // Exercise both handler paths without changing the user's system clipboard.
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__grCopied = text;
          },
        },
      }),
    );
    await page.click('loc=role:button[name="예시 복사"]');
    record(
      'copy success (mock clipboard)',
      await page.evaluate(
        () =>
          document.querySelector('[role=status]').textContent.includes('복사했습니다') &&
          window.__grCopied.includes('마음에 남은 문장'),
      ),
    );
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('denied');
          },
        },
      }),
    );
    await page.click('loc=role:button[name="예시 복사"]');
    record(
      'copy rejection (mock clipboard)',
      await page.evaluate(() =>
        document.querySelector('[role=status]').textContent.includes('복사 권한이 없습니다'),
      ),
    );
    await page.click('loc=css:#faq details:first-child summary');
    record('FAQ expands', await page.evaluate(() => document.querySelector('#faq details').open));

    await page.goto(config.baseURL + '/pdf-to-md');
    await page.snapshot({ scope: 'full_page' });
    await page.press('loc=css:#epub-font-size', 'End');
    record(
      'EPUB font changes to 28px',
      await page.evaluate(
        () => getComputedStyle(document.querySelector('.rm-reader')).fontSize === '28px',
      ),
    );
    await page.click('loc=role:tab[name="AI와 활용하기"]');
    await page.waitForSelector('loc=css:#connected-image img');
    await page.waitForFunction(
      () => document.querySelector('#connected-image img')?.naturalWidth > 0,
    );
    record(
      'Markdown connected image loads',
      await page.evaluate(() => document.querySelector('#connected-image img').naturalWidth > 0),
    );
    await page.evaluate(config.axe + '\ntrue;');
    const mdViolations = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
        })
      ).violations.map((v) => v.id),
    );
    record('ReadyMD alternate tab axe', !mdViolations.length, mdViolations);
    await page.cdp('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await page.goto(config.baseURL + '/pdf-to-md');
    await page.waitForLoadState('networkidle');
    record(
      'reduced motion uses a static hero',
      await page.evaluate(
        () =>
          !document.querySelector('.gr-lightfall-layer canvas') &&
          !document.querySelector('.gr-motion-control'),
      ),
    );
  } finally {
    await page.cdp('Emulation.setEmulatedMedia', { features: [] });
    await fs.writeFile(
      config.output + '/ui-audit.json',
      JSON.stringify({ baseURL: config.baseURL, checks }, null, 2),
    );
  }
  if (checks.some((check) => !check.passed))
    throw new Error('Public UI checks failed; see ui-audit.json');
  if (!config.space) await task.finish({ keep: [] });
  console.log(`PASS ${checks.length} public UI checks; screenshots: ${config.output}`);
}

const child = spawn('ego-browser', ['nodejs'], { stdio: ['pipe', 'inherit', 'inherit'] });
child.stdin.end(`const run = ${verify.toString()};\nawait run(${JSON.stringify(config)});`);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
