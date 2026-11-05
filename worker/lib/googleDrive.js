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

async function assertFolderReadable(config) {
  const response = await driveFetch(config, `/${config.folderId}`, { fields: 'id, mimeType, trashed' })
  if (response.status === 404) {
    throw new DriveError('drive', 'cartella non trovata o non condivisa con GOOGLE_CLIENT_EMAIL')
  }
  if (!response.ok) {
    const text = await response.text()
    const code = text.match(/"reason"\s*:\s*"([A-Za-z_]+)"/)?.[1] ?? 'unknown'
    throw new DriveError('drive', `HTTP ${response.status} ${code}`, `Drive folder check failed: ${response.status} ${text}`)
  }
  const folder = await response.json()
  if (folder.mimeType !== 'application/vnd.google-apps.folder' || folder.trashed) {
    throw new DriveError('drive', 'DRIVE_FOLDER_ID non è una cartella (o è nel cestino)')
  }
}

export async function listFolderImages(config) {
  await assertFolderReadable(config)
  const mimeFilter = ALLOWED_IMAGE_TYPES.map((type) => `mimeType = '${type}'`).join(' or ')
  const query = `'${config.folderId}' in parents and trashed = false and (${mimeFilter})`
  const files = []
  let pageToken

  do {
    const response = await driveFetch(config, '', {
      q: query,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, parents)',
      pageSize: '200',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    })
    if (!response.ok) {
      const text = await response.text()
      const code = text.match(/"reason"\s*:\s*"([A-Za-z_]+)"/)?.[1] ?? 'unknown'
      throw new DriveError('drive', `HTTP ${response.status} ${code}`, `Drive list failed: ${response.status} ${text}`)
    }
    const data = await response.json()
    files.push(...data.files)
    pageToken = data.nextPageToken
  } while (pageToken)

  return files.filter((file) => file.parents?.includes(config.folderId))
}

export async function getFolderImage(config, fileId) {
  if (!isValidDriveId(fileId)) return null

  const metadataResponse = await driveFetch(config, `/${fileId}`, { fields: 'id, mimeType, parents, trashed' })
  if (metadataResponse.status === 404) return null
  if (!metadataResponse.ok) throw new Error(`Drive metadata failed: ${metadataResponse.status}`)

  const file = await metadataResponse.json()
  const insideFolder = file.parents?.includes(config.folderId)
  if (!insideFolder || file.trashed || !ALLOWED_IMAGE_TYPES.includes(file.mimeType)) return null

  const mediaResponse = await driveFetch(config, `/${fileId}`, { alt: 'media' })
  if (!mediaResponse.ok) throw new Error(`Drive download failed: ${mediaResponse.status}`)

  return { body: mediaResponse.body, mimeType: file.mimeType }
}
