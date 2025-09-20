const CACHE = 'holly2-cache-v3';
const ASSETS = [
  '/assets/www/index.html',
  '/assets/www/styles.css',
  '/assets/www/components.js',
  '/assets/www/main.js',
  '/assets/www/manifest.webmanifest',
  '/assets/www/icons/icon-192.png',
  '/assets/www/icons/icon-512.png',
  '/assets/www/img/bg-lightning.jpg',
  '/assets/www/img/bg-hex.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(()=>caches.match('/assets/www/index.html')))
    );
  }
});
