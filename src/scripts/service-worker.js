const CACHE_NAME = "custom-fetch-cache-v1";
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log(...args);
}

self.addEventListener("install", (event) => {
  log("Service Worker: Installing");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        log("Service Worker: Cache opened");
        return cache;
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  log("Service Worker: Activating");
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              log(`Service Worker: Deleting old cache ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  log(`Service Worker: Fetching ${event.request.url}`);

  if (!shouldCache(event.request)) {
    log(`Service Worker: Not caching ${event.request.url}`);
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      // Check if we have a valid cached response
      if (cachedResponse && isCacheFresh(cachedResponse)) {
        log(`Service Worker: Serving from cache ${event.request.url}`);
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request.clone());

        if (!networkResponse || networkResponse.status !== 200) {
          log(
            `Service Worker: Invalid network response for ${event.request.url}`
          );
          return networkResponse;
        }

        // Handle JSON responses
        if (
          networkResponse.headers
            .get("content-type")
            ?.includes("application/json")
        ) {
          // Read and stringify the JSON data
          const jsonData = await networkResponse.clone().json();
          const jsonString = JSON.stringify(jsonData);

          // Create blob to get accurate byte length
          const blob = new Blob([jsonString], { type: "application/json" });

          // Create a new response with the JSON data
          const newResponse = new Response(jsonString, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: new Headers({
              "Content-Type": "application/json",
              "Content-Length": blob.size.toString(),
              "Cache-Control": "max-age=86400",
            }),
          });

          // Store in cache
          const cache = await caches.open(CACHE_NAME);
          log(`Service Worker: Caching JSON response for ${event.request.url}`);
          log(`Service Worker: JSON content length: ${blob.size}`);
          await cache.put(event.request, newResponse.clone());

          return newResponse;
        }

        // Handle non-JSON responses
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        log(`Service Worker: Caching response for ${event.request.url}`);
        await cache.put(event.request, responseToCache);

        return networkResponse;
      } catch (error) {
        log(
          `Service Worker: Network fetch failed for ${event.request.url}`,
          error
        );
        throw error;
      }
    })
  );
});

function shouldCache(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  const cacheableDomains = ["jsonplaceholder.typicode.com", location.hostname];

  if (!cacheableDomains.some((domain) => url.hostname.includes(domain))) {
    return false;
  }

  if (url.hostname === "jsonplaceholder.typicode.com") {
    return true;
  }

  const cacheableExtensions = [".json", ".js", ".css", ".png", ".jpg", ".ico"];
  return cacheableExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isCacheFresh(response) {
  if (!response || !response.headers) return false;

  const dateHeader = response.headers.get("date");
  if (!dateHeader) return false;

  const cacheTime = new Date(dateHeader).getTime();
  const now = new Date().getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  return now - cacheTime < maxAge;
}
