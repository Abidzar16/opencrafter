/**
 * Fetch the app's JS bundle from Vite and evaluate key modules in a jsdom
 * environment to surface any top-level or render-time runtime errors.
 */
import { JSDOM } from 'jsdom';

const BASE = 'http://localhost:5173';

// Minimal fetch helper
async function vite(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`${res.status} for ${path}`);
  return res.text();
}

// Set up a jsdom window
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: BASE,
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
});
const { window } = dom;

// Capture errors
const errors = [];
window.onerror = (msg, src, line, col, err) => {
  errors.push({ msg, src, line, col, stack: err?.stack });
};
window.addEventListener('unhandledrejection', e => {
  errors.push({ msg: String(e.reason), stack: e.reason?.stack });
});

// Patch fetch for jsdom context
window.fetch = fetch;

// Load and evaluate main.tsx as compiled by Vite
console.log('Loading main.tsx from Vite...');
try {
  const src = await vite('src/main.tsx');
  console.log('main.tsx fetched, first 200 chars:', src.slice(0, 200));
} catch (e) {
  console.error('Failed to fetch main.tsx:', e.message);
}

// Give 2s for async errors
await new Promise(r => setTimeout(r, 2000));

if (errors.length) {
  console.log('\n🔴 Runtime errors caught:');
  errors.forEach(e => {
    console.log(' •', e.msg);
    if (e.stack) console.log('   ', e.stack.split('\n').slice(0, 3).join('\n    '));
  });
} else {
  console.log('\nNo runtime errors caught via jsdom (limited environment — may not execute React)');
}

dom.window.close();
