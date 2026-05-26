const CACHE_NAME = "hamba-v2";

// Only pre-cache truly static assets — NOT dynamic pages like "/"
const PRECACHE_ASSETS = ["/icon-512x512.png", "/manifest.json"];

// File extensions that are safe to cache with cache-first strategy
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)(\?.*)?$/;

// Install: pre-cache static assets only
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Activate immediately without waiting for old SW to die
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// Fetch: Network-first for pages, Cache-first ONLY for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // For API routes — always go to network, don't cache
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip Next.js RSC (React Server Component) requests — these carry dynamic data
  // and must always hit the network to get fresh server-rendered content
  if (request.headers.get("RSC") || request.headers.get("Next-Router-State-Tree")) {
    return;
  }

  // For navigation requests (HTML pages) — network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For static assets (JS, CSS, images, fonts) — cache-first with network fallback
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Only cache successful same-origin responses
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For everything else — let the browser handle normally (network only)
});
