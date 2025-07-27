const CACHE_NAME = 'billard-tournament-v10.5';
const urlsToCache = [
  '/Billard-Turnier/',                     // Die Root-URL deiner PWA im Repository
  '/Billard-Turnier/index.html',           // Deine Haupt-HTML-Datei
  '/Billard-Turnier/manifest.json',        // Dein Web-App-Manifest
  '/Billard-Turnier/service-worker.js',    // Dieser Service Worker selbst
  '/Billard-Turnier/Logo.png',             // Dein Logo-Bild (falls im Root des Repo-Ordners)
  '/Billard-Turnier/Trophy.png',           // Dein Trophäen-Bild (falls im Root des Repo-Ordners)
  // Alle Icons, die in der manifest.json verwendet werden, mit dem vollständigen Pfad
  '/Billard-Turnier/icons/192.png',
  '/Billard-Turnier/icons/LargeTile.scale-100.png',
  '/Billard-Turnier/icons/android-launchericon-512-512.png'
  // Füge hier weitere Assets hinzu, die gecacht werden sollen, z.B. externe CSS oder JS:
  // '/Billard-Turnier/css/style.css', // Beispiel
  // '/Billard-Turnier/js/app.js'    // Beispiel
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
