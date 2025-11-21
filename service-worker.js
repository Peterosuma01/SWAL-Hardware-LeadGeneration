const CACHE_NAME = 'swal-shell-v1';
const OFFLINE_URL = '/SWAL-Hardware-LeadGeneration/offline.html';

const PRECACHE = [
  '/SWAL-Hardware-LeadGeneration/',
  '/SWAL-Hardware-LeadGeneration/index.html',
  '/SWAL-Hardware-LeadGeneration/manifest.json',
  OFFLINE_URL,
  '/SWAL-Hardware-LeadGeneration/icons/icon-192.png',
  '/SWAL-Hardware-LeadGeneration/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle requests that are same-origin and under our PWA subfolder
  if (url.origin === location.origin && url.pathname.startsWith('/SWAL-Hardware-LeadGeneration/')) {
    // Navigation request
    if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
      event.respondWith(
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
            return res;
          })
          .catch(() => {
            return caches.match(req).then(m => m || caches.match(OFFLINE_URL));
          })
      );
      return;
    }

    // Other requests: try cache first
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
