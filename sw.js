// Golden Shore service worker: lets the game open from the home screen and on a weak signal.
// Network first, so players always get the newest version when online; the cache is only a fallback.
// Bump CACHE whenever the list of files below changes.
const CACHE = 'goldenshore-v9';
const CORE = [
  '/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png',
  '/play/', '/play/index.html', '/play/frame.html', '/play/styles.css',
  '/play/js/config.js',
  '/play/js/core.js',
  '/play/js/glyphs.js',
  '/play/js/items.js',
  '/play/js/world.js',
  '/play/js/fish.js',
  '/play/js/people.js',
  '/play/js/fishing.js',
  '/play/js/state.js',
  '/play/js/online.js',
  '/play/js/ui.js',
  '/play/js/title.js',
  '/play/js/chart.js',
  '/play/js/sealore.js',
  '/play/js/sea.js',
  '/play/js/seaart.js',
  '/play/js/places.js',
  '/play/js/site.js',
  '/play/js/seafog.js',
  '/play/js/seaweather.js',
  '/play/js/seawater.js',
  '/play/js/peep-parts.js', '/play/js/peep-color.js', '/play/js/peeps.js',
  '/play/js/harbour.js',
  '/play/js/port.js',
  '/play/js/rewards.js',
  '/play/js/bandits.js',
  '/play/js/battle.js',
  '/play/js/atlas.js',
  '/play/js/coach.js',
  '/play/js/desk.js',
  '/play/js/main.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // fonts, Supabase and CDNs go straight to the network
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('/play/')))
  );
});
