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

assert(fs.existsSync(swPath), 'Expected dist/sw.js to exist');
assert(
  fs.readdirSync(distDir).some((file) => /^workbox-.*\.js$/.test(file)),
  'Expected a Workbox runtime chunk'
);

const indexHtml = fs.readFileSync(indexPath, 'utf-8');
assert(
  /navigator\.serviceWorker\.register|registerSW\(|service-worker\.js|workbox/i.test(indexHtml),
  'Expected dist/index.html to reference SW registration'
);

const sw = fs.readFileSync(swPath, 'utf-8');
assert(
  !/\.mp3|sounds|\.mp4|videos/i.test(sw),
  'Audio/video files must not be precached by the service worker'
);

console.log('PWA build output verified');
