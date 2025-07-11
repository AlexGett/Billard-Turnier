const CACHE_NAME = 'billard-turnier-v2.6'; // Ändere die Version bei Änderungen an den gecachten Dateien!
                                          // Habe die Version hier auf v1.3 erhöht, da sich die gecachten Dateien ändern.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Füge hier die Pfade zu ALLEN deinen Icons hinzu, die du im 'icons/' Ordner hast
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/LargeTile.scale-100.png', // Korrigierter Pfad für dein vorhandenes Icon
  '/icons/android-launchericon-512-512.png', // Korrigierter Pfad für dein vorhandenes Icon
  '/icons/1024.png' // Korrigierter Pfad für dein vorhandenes Icon
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
