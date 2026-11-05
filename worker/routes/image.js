import { getFolderImage, readConfig } from '../lib/googleDrive.js'

const CACHE_SECONDS = 86400

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
}

export async function handleImage(request, env, ctx, fileId) {
  const cache = caches.default
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const image = await getFolderImage(readConfig(env), fileId)
    if (!image) return notFound()

    const response = new Response(image.body, {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    })
    ctx.waitUntil(cache.put(request, response.clone()))
    return response
  } catch (error) {
    console.error(error)
    return new Response('Image unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
