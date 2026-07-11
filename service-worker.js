const CACHE = 'phactoryfit-v1.2.0';
const OFFLINE_PAGE = './index.html';
const APP_SHELL = [
  './',
  OFFLINE_PAGE,
  './styles.css?v=1.2.0',
  './app.js?v=1.2.0',
  './config.js?v=1.2.0',
  './vendor/zxing-browser.min.js?v=1.2.0',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './assets/favicon-32.png',
  './assets/apple-touch-icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-192.png',
  './assets/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(OFFLINE_PAGE, copy));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(response => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || new Response('Offline', {status:503,statusText:'Offline'}));
      return cached || network;
    })
  );
});
