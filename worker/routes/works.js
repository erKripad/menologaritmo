import { listFolderImages, readConfig } from '../lib/googleDrive.js'
import { workFromFileName } from '../lib/workFromFileName.js'

const MAX_WORKS = 12
const CACHE_SECONDS = 300

function json(body, status, cacheControl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function handleWorks(request, env, ctx) {
  const cache = caches.default
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const config = readConfig(env)
    const files = await listFolderImages(config)

    const works = []
    for (const file of files) {
      const work = workFromFileName(file.name)
      if (!work) {
        console.warn(`Skipped file with invalid name: "${file.name}"`)
        continue
      }
      works.push({
        id: file.id,
        ...work,
        image: `/api/images/${file.id}?v=${encodeURIComponent(file.modifiedTime)}`,
      })
    }

    works.sort((a, b) => b.sortKey.localeCompare(a.sortKey) || a.artist.localeCompare(b.artist, 'it'))
    const body = { works: works.slice(0, MAX_WORKS).map(({ sortKey: _sortKey, ...work }) => work) }

    const response = json(body, 200, `public, max-age=${CACHE_SECONDS}`)
    ctx.waitUntil(cache.put(request, response.clone()))
    return response
  } catch (error) {
    console.error(error)
    return json(
      { error: 'Impossibile caricare i lavori recenti', reason: error.reason ?? 'unknown', detail: error.detail ?? null },
      502,
      'no-store',
    )
  }
}

export function apiNotFound() {
  return json({ error: 'Not found' }, 404, 'no-store')
}
