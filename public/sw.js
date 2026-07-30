/* Invensa service worker — minimal, install-only.
   No offline cache for V1 (dashboard data needs Supabase + network).
   This file exists so the browser fires `beforeinstallprompt` and offers
   "Install app" in the address bar / sidebar button.
   Bump CACHE_NAME when adding real caching. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});