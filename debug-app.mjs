import { chromium } from 'playwright';
import { setTimeout as sleep } from 'timers/promises';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();

const consoleMessages = [];
const pageErrors = [];

page.on('console', msg => {
  consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => pageErrors.push(err.message + '\n' + err.stack));

console.log('Navigating to http://localhost:5173 ...');
try {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
} catch (e) {
  console.log('goto warning:', e.message);
}

await sleep(3000);

console.log('Title:', await page.title());

const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 1000));
console.log('\n--- body innerHTML (first 1000 chars) ---');
console.log(bodyHTML || '(empty)');

const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 800));
console.log('\n--- #root innerHTML ---');
console.log(rootHTML || '(empty — React did not mount)');

// Check for Vite error overlay
const viteError = await page.evaluate(() => {
  const el = document.querySelector('vite-error-overlay');
  if (!el) return null;
  const sr = el.shadowRoot;
  return sr?.querySelector('.message-body')?.textContent?.trim()
    ?? sr?.textContent?.trim().slice(0, 600)
    ?? el.innerHTML.slice(0, 600);
});

if (viteError) {
  console.log('\n--- Vite error overlay ---');
  console.log(viteError);
}

console.log('\n--- Console messages ---');
if (consoleMessages.length) consoleMessages.forEach(m => console.log(' ', m));
else console.log('  (none)');

console.log('\n--- Page errors ---');
if (pageErrors.length) pageErrors.forEach(e => console.log(' ', e));
else console.log('  (none)');

await page.screenshot({ path: '/tmp/app-screenshot.png', fullPage: true });
console.log('\nScreenshot → /tmp/app-screenshot.png');

await browser.close();
