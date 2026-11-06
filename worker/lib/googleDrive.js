const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_URL = 'https://www.googleapis.com/drive/v3/files'
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

const ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/

let cachedToken = null

export class DriveError extends Error {
  constructor(reason, detail, message) {
    super(message ?? `${reason}: ${detail}`)
    this.reason = reason
    this.detail = detail
  }
}

export function isValidDriveId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id)
}

function folderIdFrom(value) {
  const text = value?.trim()
  if (!text) return text
  return text.match(/folders\/([A-Za-z0-9_-]+)/)?.[1] ?? text.split('?')[0]
}

export function readConfig(env) {
  const folderId = folderIdFrom(env.DRIVE_FOLDER_ID)
  const clientEmail = env.GOOGLE_CLIENT_EMAIL
  const privateKey = env.GOOGLE_PRIVATE_KEY
  const problems = [
    !folderId && 'DRIVE_FOLDER_ID mancante',
    folderId && !isValidDriveId(folderId) && 'DRIVE_FOLDER_ID non valido',
    !clientEmail && 'GOOGLE_CLIENT_EMAIL mancante',
    !privateKey && 'GOOGLE_PRIVATE_KEY mancante',
  ].filter(Boolean)
  if (problems.length) throw new DriveError('config', problems.join(', '))
  return { folderId, clientEmail, privateKey }
}

function base64UrlFromBytes(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlFromJson(value) {
  return base64UrlFromBytes(new TextEncoder().encode(JSON.stringify(value)))
}

function extractPem(value) {
  const trimmed = value.trim().replace(/^"|"$/g, '')
  if (!trimmed.startsWith('{')) return trimmed
  try {
    return JSON.parse(trimmed).private_key ?? ''
  } catch {
    return trimmed
  }
}

async function importPrivateKey(value) {
  const body = extractPem(value)
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  try {
    const der = Uint8Array.from(atob(body), (char) => char.charCodeAt(0))
    return await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
      'sign',
    ])
  } catch {
    throw new DriveError('key', 'GOOGLE_PRIVATE_KEY non è una chiave privata valida')
  }
}

async function createSignedJwt({ clientEmail, privateKey }) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlFromJson({ alg: 'RS256', typ: 'JWT' })
  const claims = base64UrlFromJson({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  const unsigned = `${header}.${claims}`
  const key = await importPrivateKey(privateKey)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  return `${unsigned}.${base64UrlFromBytes(new Uint8Array(signature))}`
}

async function getAccessToken(config) {
  if (cachedToken && cachedToken.clientEmail === config.clientEmail && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await createSignedJwt(config),
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    const code = text.match(/"error"\s*:\s*"([a-z_]+)"/)?.[1] ?? `HTTP ${response.status}`
    throw new DriveError('auth', code, `Google token request failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  cachedToken = {
    clientEmail: config.clientEmail,
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.value
}

async function driveFetch(config, path, params) {
  const url = new URL(`${DRIVE_URL}${path}`)
  url.search = new URLSearchParams({ supportsAllDrives: 'true', ...params }).toString()
  const token = await getAccessToken(config)
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
}

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
const SUBFOLDER_NAME_PATTERN = /^[a-z0-9-]+$/
const SUBFOLDER_CACHE_MS = 5 * 60 * 1000

const subfolderCache = new Map()

async function driveError(response, label) {
  const text = await response.text()
  const code = text.match(/"reason"\s*:\s*"([A-Za-z_]+)"/)?.[1] ?? 'unknown'
  return new DriveError('drive', `HTTP ${response.status} ${code}`, `${label}: ${response.status} ${text}`)
}

async function assertFolderReadable(config) {
  const response = await driveFetch(config, `/${config.folderId}`, { fields: 'id, mimeType, trashed' })
  if (response.status === 404) {
    throw new DriveError('drive', 'cartella non trovata o non condivisa con GOOGLE_CLIENT_EMAIL')
  }
  if (!response.ok) throw await driveError(response, 'Drive folder check failed')
  const folder = await response.json()
  if (folder.mimeType !== FOLDER_MIME_TYPE || folder.trashed) {
    throw new DriveError('drive', 'DRIVE_FOLDER_ID non è una cartella (o è nel cestino)')
  }
}

async function listFiles(config, query, fields) {
  const files = []
  let pageToken

  do {
    const response = await driveFetch(config, '', {
      q: query,
      fields: `nextPageToken, files(${fields})`,
      pageSize: '200',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    })
    if (!response.ok) throw await driveError(response, 'Drive list failed')
    const data = await response.json()
    files.push(...data.files)
    pageToken = data.nextPageToken
  } while (pageToken)

  return files
}

export async function resolveSubfolder(config, name) {
  if (!SUBFOLDER_NAME_PATTERN.test(name)) throw new Error(`Invalid subfolder name: ${name}`)

  const cacheKey = `${config.folderId}/${name}`
  const cached = subfolderCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.id

  await assertFolderReadable(config)
  const query = `'${config.folderId}' in parents and name = '${name}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`
  const folders = (await listFiles(config, query, 'id, parents')).filter((folder) =>
    folder.parents?.includes(config.folderId),
  )
  if (!folders.length) throw new DriveError('drive', `cartella "${name}" non trovata dentro website`)
  if (folders.length > 1) console.warn(`More than one "${name}" folder inside website: using the first one`)

  subfolderCache.set(cacheKey, { id: folders[0].id, expiresAt: Date.now() + SUBFOLDER_CACHE_MS })
  return folders[0].id
}

const IMAGE_FIELDS = 'id, name, mimeType, modifiedTime, parents, imageMediaMetadata(width, height, rotation)'
const EVENT_FOLDERS_CACHE_MS = 5 * 60 * 1000

const eventFoldersCache = new Map()

// Cartelle direttamente dentro folderId (una per evento)
export async function listSubfolders(config, folderId, { fresh = false } = {}) {
  const cached = eventFoldersCache.get(folderId)
  if (!fresh && cached && cached.expiresAt > Date.now()) return cached.folders

  const query = `'${folderId}' in parents and trashed = false and mimeType = '${FOLDER_MIME_TYPE}'`
  const folders = (await listFiles(config, query, 'id, name, parents')).filter((folder) =>
    folder.parents?.includes(folderId),
  )
  eventFoldersCache.set(folderId, { folders, expiresAt: Date.now() + EVENT_FOLDERS_CACHE_MS })
  return folders
}

// File (non cartelle) direttamente dentro una delle cartelle indicate, con le misure delle foto
export async function listFilesIn(config, folderIds) {
  const ids = folderIds.filter(isValidDriveId)
  if (!ids.length) return []
  const parents = ids.map((id) => `'${id}' in parents`).join(' or ')
  const query = `(${parents}) and trashed = false and mimeType != '${FOLDER_MIME_TYPE}'`
  const files = await listFiles(config, query, IMAGE_FIELDS)
  return files.filter((file) => file.parents?.some((parent) => ids.includes(parent)))
}

// Una foto viene servita solo se sta in una cartella evento, cioè in una sottocartella di rootFolderId
export async function getEventImage(config, fileId, rootFolderId) {
  if (!isValidDriveId(fileId)) return null

  const metadataResponse = await driveFetch(config, `/${fileId}`, { fields: 'id, mimeType, parents, trashed' })
  if (metadataResponse.status === 404) return null
  if (!metadataResponse.ok) throw await driveError(metadataResponse, 'Drive metadata failed')

  const file = await metadataResponse.json()
  if (file.trashed || !ALLOWED_IMAGE_TYPES.includes(file.mimeType)) return null

  const isInEventFolder = (folders) => file.parents?.some((parent) => folders.some((folder) => folder.id === parent))
  if (!isInEventFolder(await listSubfolders(config, rootFolderId))) {
    if (!isInEventFolder(await listSubfolders(config, rootFolderId, { fresh: true }))) return null
  }

  const mediaResponse = await driveFetch(config, `/${fileId}`, { alt: 'media' })
  if (!mediaResponse.ok) throw await driveError(mediaResponse, 'Drive download failed')

  return { body: mediaResponse.body, mimeType: file.mimeType }
}
