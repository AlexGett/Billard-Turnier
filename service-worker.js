const CACHE_NAME = 'billard-tournament-v10.1';
const urlsToCache = [
  'https://alexgett.github.io/Billard-Turnier/',    // Die Root-URL deiner PWA
  '/index.html',           // Deine Haupt-HTML-Datei
  '/manifest.json',        // Dein Web-App-Manifest
  '/service-worker.js',    // Dieser Service Worker selbst
  '/Logo.png',             // Dein Logo-Bild
  '/Trophy.png',           // Dein Trophäen-Bild
  // Alle Icons, die in der manifest.json verwendet werden
  '/icons/192.png',
  '/icons/LargeTile.scale-100.png',
  '/icons/android-launchericon-512-512.png'
  // Füge hier weitere Assets hinzu, die gecacht werden sollen, z.B. externe CSS oder JS:
  // '/css/style.css',
  // '/js/app.js'
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
