const CACHE_NAME = 'kenya-crop-health-v14-result-visibility';
const ASSETS_TO_CACHE = [
  '/',
  '/static/index.html',
  '/static/style.css',
  '/static/pulse-theme.css',
  '/static/pulse-premium.css',
  '/static/pulse-blue.css',
  '/static/pulse-leaves.css',
  '/static/premium-green.css',
  '/static/pulse-enhance.js',
  '/static/app.js',
  '/static/manifest.json',
  '/static/icon-192.svg',
  '/static/icon-512.svg',
  '/static/locales/en.json',
  '/static/locales/sw.json',
  '/static/locales/hi.json',
  '/static/locales/ta.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({
      status: 'network_offline',
      message: 'You are offline. AI disease inference requires an active connection.'
    }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  event.respondWith(fetch(event.request).then(response => {
    if (response && response.status === 200 && response.type === 'basic') {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/static/index.html'))));
});
