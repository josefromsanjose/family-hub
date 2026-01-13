// Service Worker for Household Hub
// Network-first strategy for API/data (online database)
// Cache-first strategy for app shell (offline app loading)

const CACHE_NAME = 'household-hub-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Assets will be cached automatically as they're requested
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        // Don't fail if some files don't exist
        console.log('Cache addAll error:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
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
  // Take control immediately
  return self.clients.claim();
});

// Fetch event - Network-first for API, Cache-first for app shell
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.protocol === 'moz-extension:'
  ) {
    return;
  }

  // API/Data requests: Network-first strategy (no caching)
  // This ensures fresh data from database
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Return network response directly, don't cache
          return response;
        })
        .catch(() => {
          // Network failed - return offline response
          return new Response(
            JSON.stringify({ 
              error: 'Offline', 
              message: 'Cannot connect to server. Please check your internet connection.' 
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
              statusText: 'Service Unavailable'
            }
          );
        })
    );
    return;
  }

  // App shell and static assets: Cache-first strategy
  // This enables offline app loading
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache for offline use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed - try to return cached version
          // For navigation requests, return cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          // For other requests, return cached version if available
          return caches.match(request);
        });
    })
  );
});
