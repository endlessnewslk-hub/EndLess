const CACHE_NAME = 'endless-v6';
const BASE_URL = 'https://endlessnews.lk';

const urlsToCache = [
  BASE_URL + '/styles.css',
  BASE_URL + '/scripts.js',
  BASE_URL + '/logo-og.png',
  BASE_URL + '/manifest.json'
];

// HTML files — NETWORK FIRST (always fresh content, cache = backup only)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Share links /news/* must always go to network (OG worker handles it, not this SW)
  if (req.url.includes('/news/')) {
    return; // browser handles it normally
  }

  // For pages & scripts: try network first, fall back to cache when offline
  if (req.mode === 'navigate' || req.url.includes('.html') || req.url.includes('.js') || req.url.includes('.css')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // Update cache with fresh copy in background
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match(BASE_URL + '/index.html')))
    );
    return;
  }

  // Images & other assets: cache first (fast)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('SW cache skip:', url)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});