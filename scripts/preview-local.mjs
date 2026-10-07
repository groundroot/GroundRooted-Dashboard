// Local-only preview supervised by macOS launchd, independent of the coding terminal.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { createServer } from 'node:net';

if (process.platform !== 'darwin' || process.versions.node.split('.')[0] !== '24') {
  throw new Error('Run this macOS preview launcher with Node 24.');
}
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtime = join(homedir(), 'Library', 'Caches', 'GroundRooted', 'website-preview');
const release = join(runtime, 'releases', String(Date.now()));
const label = 'com.groundrooted.website-preview';
const domain = `gui/${process.getuid()}`;
const url = 'http://127.0.0.1:3045';
const refresh = process.argv.includes('--refresh');
const plist = join(runtime, `${label}.plist`);
const command = (program, args, options = {}) => {
  const result = spawnSync(program, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${program} failed (${result.status})`);
};
const existing = spawnSync('/bin/launchctl', ['print', `${domain}/${label}`], { stdio: 'ignore' });
if (existing.status === 0 && !refresh) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Existing preview needs inspection: HTTP ${response.status}`);
  console.log(`Preview already running: ${url}`);
  process.exit(0);
}
if (existing.status !== 0) await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on('error', reject);
  probe.listen(3045, '127.0.0.1', () => probe.close(resolve));
});
mkdirSync(release, { recursive: true });
command('/usr/bin/rsync', ['-a', '--exclude=.git', '--exclude=.next', '--exclude=node_modules', '--exclude=output', '--exclude=.playwright-cli', '--exclude=.env*', '--exclude=*.tsbuildinfo', `${root}/`, `${release}/`]);
command('/bin/ln', ['-s', join(root, 'node_modules'), join(release, 'node_modules')]);
const node = realpathSync(process.execPath);
const next = join(release, 'node_modules', 'next', 'dist', 'bin', 'next');
command(node, [next, 'build', '--webpack'], { cwd: release });
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// Build first so a failed build cannot take the working preview offline.
const previousPlist = existing.status === 0 ? readFileSync(plist, 'utf8') : null;
const args = [node, next, 'start', '--hostname', '127.0.0.1', '--port', '3045'];
writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array>${args.map(arg => `<string>${xml(arg)}</string>`).join('')}</array>
<key>WorkingDirectory</key><string>${xml(release)}</string>
<key>EnvironmentVariables</key><dict><key>NODE_ENV</key><string>production</string><key>MARKETING_PREVIEW_ENABLED</key><string>true</string></dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer>
<key>StandardOutPath</key><string>${xml(join(runtime, 'stdout.log'))}</string>
<key>StandardErrorPath</key><string>${xml(join(runtime, 'stderr.log'))}</string>
</dict></plist>\n`);
async function bootstrap() {
  // bootout returns before launchd finishes unregistering the previous job.
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = spawnSync('/bin/launchctl', ['bootstrap', domain, plist], { encoding: 'utf8' });
    if (result.status === 0) return;
    if (attempt === 29) throw new Error(`Preview bootstrap failed (${result.status}).`);
    await setTimeout(250);
  }
}
async function rollback() {
  if (!previousPlist) return;
  spawnSync('/bin/launchctl', ['bootout', `${domain}/${label}`], { stdio: 'ignore' });
  writeFileSync(plist, previousPlist);
  await bootstrap();
}
try {
  if (existing.status === 0) command('/bin/launchctl', ['bootout', `${domain}/${label}`]);
  await bootstrap();
} catch (error) { await rollback(); throw error; }
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (response.ok && (await response.text()).includes('gs-hero-visual')) {
      console.log(`Preview ready: ${url}\nRuntime: ${runtime}\nStop: launchctl bootout ${domain}/${label}`);
      process.exit(0);
    }
  } catch { /* launchd may still be starting the listener */ }
  await setTimeout(1000);
}
await rollback();
throw new Error(`Preview did not become healthy; restored previous job if available. Inspect ${runtime}/stderr.log`);
