const CACHE_NAME = 'endless-admin-v4';
const BASE_URL = 'https://endlessnews.lk';

const urlsToCache = [
  BASE_URL + '/',
  BASE_URL + '/index.html',
  BASE_URL + '/styles.css',
  BASE_URL + '/scripts.js',
  BASE_URL + '/x7k9m2.html',
  BASE_URL + '/dashboard.html',
  BASE_URL + '/x7k9m2.css',
  BASE_URL + '/x7k9m2.js',
  BASE_URL + '/guard.js',
  BASE_URL + '/dashboard.js',
  BASE_URL + '/logo-og.png',
  BASE_URL + '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('SW: Failed to cache:', url, err);
            })
          )
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});