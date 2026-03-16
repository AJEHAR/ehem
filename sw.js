// eHEM — Service Worker
const CACHE_NAME = 'ehem-v1';
const STATIC_ASSETS = [
  '/ehem/',
  '/ehem/index.html',
  '/ehem/manifest.json',
  '/ehem/icon-192.png',
  '/ehem/icon-512.png'
];

// Domains to BYPASS (never cache — live data)
const BYPASS_DOMAINS = [
  'script.google.com',
  'googleapis.com',
  'accounts.google.com',
  'moe-dl.edu.my'
];

self.addEventListener('install', event => {
  console.log('[eHEM SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[eHEM SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[eHEM SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bypass GAS and Google API requests — always fetch from network
  if (BYPASS_DOMAINS.some(d => url.hostname.includes(d))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && url.pathname.startsWith('/ehem/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/ehem/index.html'));
    })
  );
});
