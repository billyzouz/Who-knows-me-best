const CACHE_NAME = 'wkmb-v4'
// Only truly immutable files (icons/favicon never change between deploys)
const STATIC_ASSETS = ['/favicon.ico', '/icon-192x192.png', '/icon-512x512.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
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

  // Never intercept Supabase or API routes
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) return

  // Cache-first only for /_next/static (content-hashed, truly immutable per build)
  // and the static icon/favicon files above
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

  // Network-only for HTML pages — never cache, always fresh
  // (caching HTML causes stale JS references after deploys)
  event.respondWith(
    fetch(event.request).catch(() => Response.error())
  )
})
