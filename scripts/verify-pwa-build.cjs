const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../dist');
const swPath = path.join(distDir, 'sw.js');
const indexPath = path.join(distDir, 'index.html');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(full);
    if (!entry.isFile() || !entry.name.endsWith('.js')) return [];
    // The service worker and its Workbox runtime are the registration target, not the caller.
    if (full === swPath || /^workbox-.*\.js$/.test(entry.name)) return [];
    return [full];
  });
}

assert(fs.existsSync(swPath), 'Expected dist/sw.js to exist');
assert(
  fs.readdirSync(distDir).some((file) => /^workbox-.*\.js$/.test(file)),
  'Expected a Workbox runtime chunk'
);

// `injectRegister: 'auto'` skips the HTML snippet because the app imports
// virtual:pwa-register/react, so registration lands in an app chunk instead.
const indexHtml = fs.readFileSync(indexPath, 'utf-8');
const registersInHtml = /navigator\.serviceWorker\.register|registerSW\(/.test(indexHtml);
const registersInBundle = collectJsFiles(distDir).some((file) => {
  const code = fs.readFileSync(file, 'utf-8');
  // Backticks included: the Oxc minifier normalises string literals to template
  // literals, so a quote-only pattern silently stops matching the registration.
  return /serviceWorker/.test(code) && /["'`][^"'`]*\/sw\.js["'`]/.test(code);
});
assert(
  registersInHtml || registersInBundle,
  'Expected the build to register /sw.js from dist/index.html or an app chunk'
);

const sw = fs.readFileSync(swPath, 'utf-8');
assert(
  !/\.mp3|sounds|\.mp4|videos/i.test(sw),
  'Audio/video files must not be precached by the service worker'
);

console.log('PWA build output verified');
