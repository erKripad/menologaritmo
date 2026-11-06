// Lavori finti, usati solo con "npm run dev" quando l'API di Google Drive non è attiva.
// Sul sito pubblicato arrivano da Google Drive: website/eventi-recenti, una cartella per evento.
const placeholderWorks = Array.from({ length: 5 }, (_, index) => ({
  slug: `lavoro-${index + 1}`,
  artist: 'Nome artista',
  venue: 'Locale, Città',
  date: 'Mese 2026',
  image: null,
}))

// Proporzioni miste (orizzontali, verticali, quadrate) per vedere le tre colonne della galleria
const PLACEHOLDER_SIZES = [
  [1600, 1067],
  [1067, 1600],
  [1200, 1200],
  [1600, 900],
  [1000, 1500],
  [1600, 1067],
  [1200, 1500],
  [1600, 1067],
  [1067, 1600],
  [1600, 900],
  [1200, 1200],
  [1000, 1500],
]

export function placeholderGallery(slug) {
  const work = placeholderWorks.find((item) => item.slug === slug)
  if (!work) return null
  return {
    work,
    photos: PLACEHOLDER_SIZES.map(([width, height], index) => ({ id: `${slug}-${index}`, image: null, width, height })),
  }
}

export default placeholderWorks
