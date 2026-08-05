const CACHE_NAME = "abacus-genius-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/icon.svg",
  "/manifest.json"
];

// Install Event: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core offline shell");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Cleaning up stale cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: network-first for APIs/ERP, stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip POST requests, Firebase socket connections, and backend API requests
  if (req.method !== "GET" || url.pathname.startsWith("/api") || url.hostname.includes("firestore") || url.hostname.includes("firebase")) {
    return; // Let the browser handle these directly
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Cache successful static responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a page navigation request, return index.html
          if (req.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
