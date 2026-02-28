/* ═══════════════════════════════════════════════════
   SeniorVoice — Service Worker
   Cache-first strategy for offline support
   ═══════════════════════════════════════════════════ */

const CACHE = 'seniorvoice-v9';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Don't cache API calls or external resources
  const url = new URL(e.request.url);
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api/')
  ) {
    return; // Let browser handle external requests normally
  }

  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request).then(response => {
        // Cache successful GET responses for app assets
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }))
      .catch(() => caches.match('/index.html'))
  );
});
