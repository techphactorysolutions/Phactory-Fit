const CACHE = 'phactoryfit-v1.6.2';
const OFFLINE_PAGE = './index.html';
const CORE_SHELL = [
  './',
  OFFLINE_PAGE,
  './styles.css?v=1.6.2',
  './app.js?v=1.6.2',
  './config.js?v=1.6.2',
  './manifest.webmanifest'
];
const OPTIONAL_SHELL = [
  './zxing-browser.min.js?v=1.6.2',
  './apple-touch-icon.png',
  './favicon-32.png',
  './apple-touch-icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async cache => {
        await cache.addAll(CORE_SHELL);
        await Promise.allSettled(OPTIONAL_SHELL.map(asset => cache.add(asset)));
      })
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

  const isCode = /\.(?:js|css)$/.test(requestUrl.pathname);
  if (isCode) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || new Response('Offline', {status:503,statusText:'Offline'}))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => new Response('Offline', {status:503,statusText:'Offline'})))
  );
});
