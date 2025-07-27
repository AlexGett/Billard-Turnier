const CACHE_NAME = 'billard-tournament-v9.5';
const urlsToCache = [
  '/', // Der Root-Pfad deiner Anwendung
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  '/Logo.png',
  '/Trophy.png',
  // Icon-Dateien aus der manifest.json
  '/icons/192.png',
  '/icons/LargeTile.scale-100.png',
  '/icons/android-launchericon-512-512.png'
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
