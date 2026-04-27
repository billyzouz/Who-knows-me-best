const CACHE_NAME = 'wkmb-v1'
const STATIC_ASSETS = ['/', '/favicon.ico', '/icon-192x192.png', '/icon-512x512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept Supabase realtime/API or our own API routes
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) return

  // Cache-first for immutable static assets
  if (url.pathname.startsWith('/_next/static') || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            return res
          })
      )
    )
    return
  }

  // Network-first for pages — fall back to cache if offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
