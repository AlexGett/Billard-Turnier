const CACHE_NAME = 'billard-turnier-v1.2'; // Ändere die Version bei Änderungen an den gecachten Dateien!
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Füge hier die Pfade zu allen deinen Icons hinzu, die du im 'icons/' Ordner hast
  '/icons/LargeTile.scale-100.png',
  '/icons/android-launchericon-512-512.png',
  '/icons/1024.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Alten Cache löschen', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
