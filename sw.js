const CACHE_NAME = 'day-trips-v1';

// All files to cache for offline use
const STATIC_FILES = [
  '/day-trips/',
  '/day-trips/00_TRIP_INDEX.html',
  '/day-trips/01_montegrotto_relilax.html',
  '/day-trips/02_abano_terme.html',
  '/day-trips/03_levico_terme.html',
  '/day-trips/04_merano.html',
  '/day-trips/05_desenzano_sirmione.html',
  '/day-trips/06_lago_di_garda_north.html',
  '/day-trips/07_belluno_dolomites.html',
  '/day-trips/08_lago_di_caldonazzo.html',
  '/day-trips/09_trento_mountains.html',
  '/day-trips/10_peschiera_garda.html',
  '/day-trips/11_bologna.html',
  '/day-trips/12_trieste.html',
  '/day-trips/13_ferrara.html',
  '/day-trips/14_mantova.html',
  '/day-trips/15_milan.html',
  '/day-trips/manifest.json',
  '/day-trips/icons/icon-192.png',
  '/day-trips/icons/icon-512.png'
];

// ---- INSTALL: cache all static files ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching all trip files');
      // Cache files individually so one failure doesn't break the whole install
      return Promise.allSettled(
        STATIC_FILES.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Failed to cache:', url, err)
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE: clean up old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ---- FETCH: cache-first strategy ----
// Serve from cache if available, fallback to network, update cache in background
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (Google Fonts, Maps iframes, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);

      // Fetch from network (don't await — run in background to update cache)
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      // Return cache immediately if we have it, otherwise wait for network
      return cached || networkFetch;
    })
  );
});

// ---- MESSAGE: force update from app ----
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
