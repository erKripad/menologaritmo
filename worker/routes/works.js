import { ALLOWED_IMAGE_TYPES, listFolderFiles, readConfig, resolveSubfolder } from '../lib/googleDrive.js'
import { DRIVE_FOLDERS } from '../driveFolders.js'
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
    const folderId = await resolveSubfolder(config, DRIVE_FOLDERS.recentWorks)
    const files = await listFolderFiles(config, folderId)
    console.log(`${DRIVE_FOLDERS.recentWorks}: ${files.length} file trovati`)

    const works = []
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
        console.warn(`Scartato "${file.name}": formato ${file.mimeType} non supportato (solo JPG, PNG, WebP, AVIF)`)
        continue
      }
      const work = workFromFileName(file.name)
      if (!work) {
        console.warn(`Scartato "${file.name}": nome non nel formato "AAAA-MM-GG - Artista - Locale, Città.jpg"`)
        continue
      }
      console.log(`Mostrato "${file.name}"`)
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
