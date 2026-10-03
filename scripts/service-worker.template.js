const CACHE = 'konglog-shell-__VERSION__';
const SHELL = [];
const ROOT = new URL('./', self.location.href).href;
const ALLOWED = new Set(SHELL.map(path => new URL(path, ROOT).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(path => new Request(new URL(path, ROOT), { cache: 'reload', credentials: 'omit' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('konglog-shell-') && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Runtime APIs, request bodies, query strings, and third-party resources are
  // never cached. In particular, no memo/weight/code/status offline queue.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && url.pathname === new URL(ROOT).pathname) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(ROOT, { ignoreVary: true }) ?? Response.error();
    }));
    // Never overwrite cached HTML with another build's asset references.
    return;
  }
  if (url.search || !ALLOWED.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => await cache.match(request, { ignoreVary: true }) ?? fetch(request)));
});
