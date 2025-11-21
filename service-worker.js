const CACHE_NAME = 'steelwool-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  '/',
  '/Index.html',
  '/manifest.json',
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install - cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - network-first for navigation, cache fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Don't try to cache cross-origin iframe content (apps script) - leave network to browser
  if (url.origin !== location.origin) {
    return; // let browser handle cross-origin requests
  }

  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(err => caches.match(req).then(m => m || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
