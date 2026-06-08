// ============================================================
// DawaTrace Service Worker — PWA Offline Support
// Strategy: Cache-first for app shell, network-first for APIs
// ============================================================

var CACHE_NAME = 'dawatrace-v1';
var APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/global-reference.js',
  '/kenya-pharma-db.js',
  '/wallet-connect.js',
  '/manifest.json',
  '/data/products.json'
];

var CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Install: cache app shell and CDN assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache app shell (fail silently for individual files)
      var appPromises = APP_SHELL.map(function(url) {
        return cache.add(url).catch(function(e) {
          console.warn('SW: Failed to cache', url, e.message);
        });
      });
      // Cache CDN assets (fail silently — they're optional for offline)
      var cdnPromises = CDN_ASSETS.map(function(url) {
        return cache.add(url).catch(function(e) {
          console.warn('SW: Failed to cache CDN', url, e.message);
        });
      });
      return Promise.all(appPromises.concat(cdnPromises));
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-only for APIs/blockchain
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Network-only for API calls (OpenFDA, RxNorm, blockchain RPCs)
  if (url.indexOf('api.fda.gov') > -1 ||
      url.indexOf('rxnav.nlm.nih.gov') > -1 ||
      url.indexOf('api.qrserver.com') > -1 ||
      url.indexOf('rpc.') > -1 ||
      url.indexOf('infura.io') > -1 ||
      url.indexOf('alchemy.com') > -1 ||
      url.indexOf('walletconnect') > -1) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // Return cached, but update in background (stale-while-revalidate)
        var fetchPromise = fetch(event.request).then(function(response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function() {});
        return cached;
      }

      // Not cached — fetch from network and cache
      return fetch(event.request).then(function(response) {
        if (response && response.ok && event.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
