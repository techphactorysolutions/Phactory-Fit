'use strict';

const CACHE = 'phactoryfit-v1.7.0';
const SCOPE_URL = new URL(self.registration.scope);
const OFFLINE_PAGE = new URL('./index.html', SCOPE_URL).href;
const CORE_SHELL = [
  './',
  './index.html',
  './styles.css?v=1.7.0',
  './config.js?v=1.7.0',
  './zxing-browser.min.js?v=1.7.0',
  './app.js?v=1.7.0',
  './manifest.webmanifest'
];
const OPTIONAL_SHELL = [
  './apple-touch-icon.png',
  './favicon-32.png',
  './apple-touch-icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];
const CACHEABLE_PATHS = new Set([
  new URL('./', SCOPE_URL).pathname,
  new URL('./index.html', SCOPE_URL).pathname,
  new URL('./styles.css', SCOPE_URL).pathname,
  new URL('./config.js', SCOPE_URL).pathname,
  new URL('./zxing-browser.min.js', SCOPE_URL).pathname,
  new URL('./app.js', SCOPE_URL).pathname,
  new URL('./manifest.webmanifest', SCOPE_URL).pathname,
  ...OPTIONAL_SHELL.map(path => new URL(path, SCOPE_URL).pathname)
]);

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

function canCache(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return false;
  const url = new URL(request.url);
  return request.method === 'GET' && url.origin === self.location.origin && CACHEABLE_PATHS.has(url.pathname);
}

function canonicalCacheKey(request) {
  const url = new URL(request.url);
  if (/\.(?:js|css)$/.test(url.pathname)) url.search = '?v=1.7.0';
  else url.search = '';
  url.hash = '';
  return url.href;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(SCOPE_URL.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const isAppDocument = requestUrl.pathname === SCOPE_URL.pathname || requestUrl.pathname === new URL('./index.html', SCOPE_URL).pathname;
          if (isAppDocument && canCache(request, response)) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(OFFLINE_PAGE, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(OFFLINE_PAGE)) || new Response('Offline', {status:503,statusText:'Offline'}))
    );
    return;
  }

  if (!CACHEABLE_PATHS.has(requestUrl.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  const isCode = /\.(?:js|css)$/.test(requestUrl.pathname);
  if (isCode) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (canCache(request, response)) caches.open(CACHE).then(cache => cache.put(canonicalCacheKey(request), response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(canonicalCacheKey(request))) || new Response('Offline', {status:503,statusText:'Offline'}))
    );
    return;
  }

  event.respondWith(
    caches.match(canonicalCacheKey(request)).then(cached => cached || fetch(request).then(response => {
      if (canCache(request, response)) caches.open(CACHE).then(cache => cache.put(canonicalCacheKey(request), response.clone()));
      return response;
    }).catch(() => new Response('Offline', {status:503,statusText:'Offline'})))
  );
});
