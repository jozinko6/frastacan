// Fraštačan Service Worker - PWA Support
const CACHE_NAME = 'frastacan-v1';
const STATIC_CACHE = 'frastacan-static-v1';
const API_CACHE = 'frastacan-api-v1';

// App shell files to cache on install
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/frastacan-logo.png',
  '/logo.svg',
];

// Static asset extensions - cache first
const STATIC_EXTENSIONS = [
  '.js', '.css', '.woff', '.woff2', '.ttf', '.eot',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.webp', '.avif',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Helper: check if URL is an API call
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Helper: check if URL is a static asset
function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

// Fetch event - routing strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API calls: Network first, fallback to cache
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(event));
    return;
  }

  // Static assets: Cache first, fallback to network
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  // Navigation requests: Network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(event));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirst(event));
});

// Cache-first strategy (for static assets)
async function cacheFirst(event) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(event.request);

  if (cachedResponse) {
    // Update cache in background
    event.waitUntil(
      fetch(event.request).then((response) => {
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
      }).catch(() => {})
    );
    return cachedResponse;
  }

  try {
    const response = await fetch(event.request);
    if (response.ok) {
      cache.put(event.request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 408, statusText: 'Offline - asset not cached' });
  }
}

// Network-first strategy (for API calls)
async function networkFirst(event) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(event.request);
    if (response.ok) {
      // Cache successful API responses for short time
      const responseToCache = response.clone();
      cache.put(event.request, responseToCache);
    }
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Ste offline. Skúste to neskôr.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Network-first with offline fallback (for navigation)
async function networkFirstWithOfflineFallback(event) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(event.request);
    if (response.ok) {
      cache.put(event.request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to cached root page
    const rootResponse = await cache.match('/');
    if (rootResponse) {
      return rootResponse;
    }

    return new Response(
      '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fraštačan - Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF7ED;color:#B42318;text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#666}</style></head><body><div><h1>Ste offline</h1><p>Skontrolujte pripojenie k internetu a skúste znova.</p></div></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
