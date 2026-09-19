import { readFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';

// Check the published entry assets before browser tests, rather than testing an older deployment.
// Reads public static files only; no account, Cloudflare credentials or user data are involved.
const target = new URL(process.env.APP_BASE_URL || 'https://tamago.itisnowornever271.workers.dev/');
if (target.protocol !== 'https:') throw new Error('Production verification requires HTTPS');
const local = await readFile('dist/client/index.html', 'utf8');
const entries = [...local.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
if (!entries.length) throw new Error('No built entry assets found; refusing an empty deployment check');
const end = Date.now() + 300000;
let detail = 'No response';
while (Date.now() < end) {
  try {
    const url = new URL(target);
    url.searchParams.set('tamago-check', String(Date.now()));
    const response = await fetch(url, {headers:{'Cache-Control':'no-cache'}, signal:AbortSignal.timeout(10000)});
    const html = await response.text();
    const missing = entries.filter(entry => !html.includes(`"${entry}"`));
    if (response.ok && !missing.length) {
      for (const entry of entries) {
        const asset = await fetch(new URL(entry, target), {signal:AbortSignal.timeout(15000)});
        if (!asset.ok) throw new Error(`Entry asset unavailable: ${entry} (${asset.status})`);
        const remote = Buffer.from(await asset.arrayBuffer());
        const path = new URL(entry, target).pathname.replace(/^\//, '');
        const expected = await readFile(`dist/client/${path}`);
        if (!remote.equals(expected)) throw new Error(`Entry asset differs from this build: ${entry}`);
      }
      console.log(`Verified current JavaScript and CSS at ${target.origin}: ${entries.join(', ')}`);
      process.exit(0);
    }
    detail = `HTTP ${response.status}; waiting for ${missing.join(', ')}`;
  } catch (error) { detail = error instanceof Error ? error.message : String(error); }
  console.log(`Waiting for Cloudflare: ${detail}`);
  await pause(5000);
}
throw new Error(`Cloudflare did not serve this build within five minutes: ${detail}`);
