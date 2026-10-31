// Ventra Service Worker Cleanup & Unregister Stub
// Ensures any stale/cached service workers from previous PWA tests cleanly unregister
// Does NOT touch IndexedDB, localStorage, or user profile progress.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      // Release control without forcing reload
    })
  );
});
