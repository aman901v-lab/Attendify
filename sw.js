// sw.js - Service Worker for Attendify

const CACHE_NAME = "attendify-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install Event - caching all files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Files cached successfully!");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Event - cleanup old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Old cache removed:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event - serve cached files when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
