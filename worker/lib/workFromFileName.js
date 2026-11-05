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

export function workFromFileName(fileName) {
  const baseName = fileName.replace(/\.[^.]+$/, '').normalize('NFC').trim()
  const parts = baseName.split(SEPARATOR)
  if (parts.length < 3) return null

  const dateText = parts[0].trim()
  const venue = parts[parts.length - 1].trim()
  const artist = parts.slice(1, -1).join(SEPARATOR).trim()

  const match = DATE_PATTERN.exec(dateText)
  if (!match || !artist || !venue) return null

  const [, year, month, day = '00'] = match
  const monthIndex = Number(month) - 1
  if (monthIndex < 0 || monthIndex > 11 || Number(day) > 31) return null

  return {
    artist,
    venue,
    date: `${MONTHS[monthIndex]} ${year}`,
    sortKey: `${year}-${month}-${day}`,
  }
}
