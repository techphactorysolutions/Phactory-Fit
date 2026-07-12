'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const listeners = new Map();
const operations = [];
const cacheStore = new Map();

function basicResponse(body = 'ok') {
  return {
    ok: true,
    status: 200,
    type: 'basic',
    body,
    clone() { return basicResponse(body); },
  };
}

const cache = {
  async addAll(values) { operations.push(['addAll', [...values]]); },
  async add(value) { operations.push(['add', value]); },
  async put(key, response) { operations.push(['put', String(key)]); cacheStore.set(String(key), response); },
};

global.self = {
  registration: {scope: 'https://example.test/phactoryfit/'},
  location: {origin: 'https://example.test'},
  clients: {claim: async () => operations.push(['claim'])},
  skipWaiting: async () => operations.push(['skipWaiting']),
  addEventListener(type, callback) { listeners.set(type, callback); },
};

global.caches = {
  async open(name) { operations.push(['open', name]); return cache; },
  async keys() { return ['old-cache', 'phactoryfit-v1.13.0']; },
  async delete(name) { operations.push(['delete', name]); return true; },
  async match(key) { operations.push(['match', String(key)]); return cacheStore.get(String(key)); },
};

global.fetch = async request => {
  operations.push(['fetch', typeof request === 'string' ? request : request.url]);
  return basicResponse();
};

vm.runInThisContext(source, {filename: 'service-worker.js'});

async function dispatchWait(type, extras = {}) {
  let waited;
  listeners.get(type)({
    ...extras,
    waitUntil(value) { waited = Promise.resolve(value); },
  });
  if (waited) await waited;
}

async function dispatchFetch(request) {
  let responsePromise;
  listeners.get('fetch')({
    request,
    respondWith(value) { responsePromise = Promise.resolve(value); },
  });
  return responsePromise ? responsePromise : null;
}

(async () => {
  await dispatchWait('install');
  const addAll = operations.find(op => op[0] === 'addAll');
  assert(addAll, 'install must precache the required shell');
  assert(addAll[1].includes('./zxing-browser.min.js?v=1.13.0'), 'scanner must be in the required shell');
  assert(addAll[1].includes('./app.js?v=1.13.0'), 'app code must be in the required shell');
  assert(addAll[1].includes('./restaurant-foods-expanded.js?v=1.13.0'), 'expanded restaurant catalog must be in the required shell');
  assert(addAll[1].includes('./restaurant-brands.js?v=1.13.0'), 'restaurant brand registry must be in the required shell');

  operations.length = 0;
  await dispatchWait('activate');
  assert(operations.some(op => op[0] === 'delete' && op[1] === 'old-cache'));
  assert(operations.some(op => op[0] === 'claim'));

  operations.length = 0;
  const crossOrigin = await dispatchFetch({method:'GET', mode:'cors', url:'https://world.openfoodfacts.org/api/v2/search'});
  assert.equal(crossOrigin, null, 'cross-origin requests must not be intercepted or cached');
  assert.equal(operations.length, 0);

  operations.length = 0;
  await dispatchFetch({method:'GET', mode:'cors', url:'https://example.test/phactoryfit/private.json?token=secret'});
  assert(operations.some(op => op[0] === 'fetch'));
  assert(!operations.some(op => op[0] === 'put'), 'unknown same-origin paths must be network-only');

  operations.length = 0;
  await dispatchFetch({method:'GET', mode:'cors', url:'https://example.test/phactoryfit/app.js?untrusted=999'});
  await new Promise(resolve => setImmediate(resolve));
  const codePut = operations.find(op => op[0] === 'put');
  assert(codePut, 'known code assets should update the offline cache');
  assert.equal(codePut[1], 'https://example.test/phactoryfit/app.js?v=1.13.0');

  operations.length = 0;
  await dispatchFetch({method:'GET', mode:'navigate', url:'https://example.test/phactoryfit/SECURITY.md'});
  await new Promise(resolve => setImmediate(resolve));
  assert(!operations.some(op => op[0] === 'put'), 'non-app navigation must not overwrite the offline app document');

  operations.length = 0;
  await dispatchFetch({method:'GET', mode:'navigate', url:'https://example.test/phactoryfit/'});
  await new Promise(resolve => setImmediate(resolve));
  const navPut = operations.find(op => op[0] === 'put');
  assert(navPut, 'app navigation should refresh the offline document');
  assert.equal(navPut[1], 'https://example.test/phactoryfit/index.html');

  console.log('PASSED 7/7 service-worker security checks');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
