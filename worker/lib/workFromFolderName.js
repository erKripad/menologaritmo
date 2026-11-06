const MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
]

const SEPARATOR = ' - '
const DATE_PATTERN = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Nome della cartella di un evento: "AAAA-MM-GG - Nome artista - Locale, Città"
export function workFromFolderName(folderName) {
  const parts = folderName.normalize('NFC').trim().split(SEPARATOR)
  if (parts.length < 3) return null

  const dateText = parts[0].trim()
  const venue = parts[parts.length - 1].trim()
  const artist = parts.slice(1, -1).join(SEPARATOR).trim()

  const match = DATE_PATTERN.exec(dateText)
  if (!match || !artist || !venue) return null

  const [, year, month, day = '00'] = match
  const monthIndex = Number(month) - 1
  if (monthIndex < 0 || monthIndex > 11 || Number(day) > 31) return null

  const slug = slugify(`${dateText} ${artist}`)
  if (!SLUG_PATTERN.test(slug)) return null

  return {
    slug,
    artist,
    venue,
    date: `${MONTHS[monthIndex]} ${year}`,
    sortKey: `${year}-${month}-${day}`,
  }
}
