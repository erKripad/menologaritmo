import { ALLOWED_IMAGE_TYPES, listFilesIn, listSubfolders, readConfig, resolveSubfolder } from '../lib/googleDrive.js'
import { DRIVE_FOLDERS } from '../driveFolders.js'
import { SLUG_PATTERN, workFromFolderName } from '../lib/workFromFolderName.js'

const MAX_WORKS = 12
const CACHE_SECONDS = 300
const COVER_NAME = 'copertina'

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

async function cached(request, ctx, build) {
  const cache = caches.default
  const hit = await cache.match(request)
  if (hit) return hit

  const response = await build()
  if (response.status === 200 || response.status === 404) ctx.waitUntil(cache.put(request, response.clone()))
  return response
}

function failure(error, message) {
  console.error(error)
  return json({ error: message, reason: error.reason ?? 'unknown', detail: error.detail ?? null }, 502, 'no-store')
}

const baseName = (fileName) => fileName.replace(/\.[^.]+$/, '').trim()
const isCover = (file) => baseName(file.name).toLowerCase() === COVER_NAME
const byName = (a, b) => a.name.localeCompare(b.name, 'it', { numeric: true, sensitivity: 'base' })

function imageUrl(file) {
  return `/api/images/${file.id}?v=${encodeURIComponent(file.modifiedTime)}`
}

function publicWork({ sortKey: _sortKey, ...work }) {
  return work
}

// Cartelle evento valide dentro "eventi-recenti", dalla più recente
async function eventFolders(config) {
  const rootId = await resolveSubfolder(config, DRIVE_FOLDERS.recentWorks)
  const folders = await listSubfolders(config, rootId)

  const events = []
  for (const folder of folders) {
    const work = workFromFolderName(folder.name)
    if (!work) {
      console.warn(`Scartata la cartella "${folder.name}": nome non nel formato "AAAA-MM-GG - Artista - Locale, Città"`)
      continue
    }
    events.push({ folder, work })
  }
  return events.sort(
    (a, b) => b.work.sortKey.localeCompare(a.work.sortKey) || a.work.artist.localeCompare(b.work.artist, 'it'),
  )
}

// Foto di una cartella: solo JPG, PNG, WebP e AVIF, la copertina per prima
function eventPhotos(files, folder) {
  const photos = []
  for (const file of files) {
    if (!file.parents?.includes(folder.id)) continue
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
      console.warn(`Scartato "${folder.name}/${file.name}": formato ${file.mimeType} non supportato (solo JPG, PNG, WebP, AVIF)`)
      continue
    }
    photos.push(file)
  }
  return photos.sort((a, b) => Number(isCover(b)) - Number(isCover(a)) || byName(a, b))
}

function photoSize(file) {
  const { width, height, rotation = 0 } = file.imageMediaMetadata ?? {}
  if (!width || !height) return {}
  return rotation % 2 ? { width: height, height: width } : { width, height }
}

export function handleWorks(request, env, ctx) {
  return cached(request, ctx, async () => {
    try {
      const config = readConfig(env)
      const events = (await eventFolders(config)).slice(0, MAX_WORKS)
      const files = await listFilesIn(
        config,
        events.map(({ folder }) => folder.id),
      )

      const works = []
      for (const { folder, work } of events) {
        const photos = eventPhotos(files, folder)
        if (!photos.length) {
          console.warn(`Scartata la cartella "${folder.name}": nessuna foto dentro`)
          continue
        }
        if (!isCover(photos[0])) {
          console.warn(`"${folder.name}": manca la foto "copertina", uso "${photos[0].name}"`)
        }
        works.push({ ...publicWork(work), image: imageUrl(photos[0]), photoCount: photos.length })
      }

      console.log(`${DRIVE_FOLDERS.recentWorks}: ${works.length} eventi mostrati`)
      return json({ works }, 200, `public, max-age=${CACHE_SECONDS}`)
    } catch (error) {
      return failure(error, 'Impossibile caricare i lavori recenti')
    }
  })
}

export function handleWork(request, env, ctx, slug) {
  if (!SLUG_PATTERN.test(slug)) return Promise.resolve(apiNotFound())

  return cached(request, ctx, async () => {
    try {
      const config = readConfig(env)
      const event = (await eventFolders(config)).find(({ work }) => work.slug === slug)
      if (!event) return json({ error: 'Not found' }, 404, `public, max-age=${CACHE_SECONDS}`)

      const photos = eventPhotos(await listFilesIn(config, [event.folder.id]), event.folder).map((file) => ({
        id: file.id,
        image: imageUrl(file),
        ...photoSize(file),
      }))

      return json({ work: publicWork(event.work), photos }, 200, `public, max-age=${CACHE_SECONDS}`)
    } catch (error) {
      return failure(error, 'Impossibile caricare le foto dell\'evento')
    }
  })
}

export function apiNotFound() {
  return json({ error: 'Not found' }, 404, 'no-store')
}
