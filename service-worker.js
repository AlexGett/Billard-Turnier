const CACHE_NAME = 'billard-tournament-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './Logo.png', // Stellen Sie sicher, dass diese Datei existiert!
  './Trophy.png', // Stellen Sie sicher, dass diese Datei existiert!
  // Fügen Sie hier weitere Assets hinzu, die gecacht werden sollen (z.B. CSS, JS-Dateien)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
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
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});