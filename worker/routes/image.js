import { getEventImage, readConfig, resolveSubfolder } from '../lib/googleDrive.js'
import { DRIVE_FOLDERS } from '../driveFolders.js'

const CACHE_SECONDS = 86400

// Larghezze che il sito chiede (vedi src/utils/imageSources.js). Solo queste, così la cache
// non si riempie di misure inventate.
const IMAGE_WIDTHS = [640, 1280, 1920]

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
}

export async function handleImage(request, env, ctx, fileId) {
  const cache = caches.default
  const cached = await cache.match(request)
  if (cached) return cached

  const widthParam = new URL(request.url).searchParams.get('w')
  const width = widthParam === null ? null : Number(widthParam)
  if (width !== null && !IMAGE_WIDTHS.includes(width)) return notFound()

  try {
    const config = readConfig(env)
    const rootId = await resolveSubfolder(config, DRIVE_FOLDERS.recentWorks)
    const image = await getEventImage(config, fileId, rootId, width)
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
