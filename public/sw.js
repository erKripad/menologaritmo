const CACHE_NAME = 'menologaritmo-offline-v1'
const OFFLINE_URL = '/offline.html'

async function cacheOfflinePage() {
  const response = await fetch(OFFLINE_URL, { cache: 'reload' })
  if (!response.ok) throw new Error(`Offline page not available: ${response.status}`)
  const cache = await caches.open(CACHE_NAME)
  await cache.put(
    OFFLINE_URL,
    new Response(await response.blob(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  )
}

async function offlinePage() {
  const cache = await caches.open(CACHE_NAME)
  return cache.match(OFFLINE_URL)
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheOfflinePage().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.status < 500) return response
        return (await offlinePage()) ?? response
      })
      .catch(async () => (await offlinePage()) ?? Response.error()),
  )
})
