import { useState } from 'react'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import useMediaQuery from '../../../../hooks/useMediaQuery.js'
import imageSources from '../../../../utils/imageSources.js'
import './PhotoColumns.css'

// Tre colonne; sul cellulare una sola, foto una sotto l'altra nell'ordine di Drive.
const MOBILE_QUERY = '(max-width: 734px)'
const PHOTO_SIZES = '(max-width: 734px) 100vw, (max-width: 1400px) 33vw, 440px'

// Ogni foto va nella colonna più corta finora: le colonne restano pari e l'ordine
// si legge da sinistra a destra, dall'alto in basso.
function splitIntoColumns(photos, count) {
  const columns = Array.from({ length: count }, () => ({ height: 0, photos: [] }))
  photos.forEach((photo, index) => {
    const ratio = photo.width && photo.height ? photo.height / photo.width : 1
    const shortest = columns.reduce((best, column) => (column.height < best.height ? column : best))
    shortest.height += ratio
    shortest.photos.push({ ...photo, index })
  })
  return columns.map((column) => column.photos)
}

function Photo({ photo, alt, columns }) {
  const [loaded, setLoaded] = useState(false)
  const ratio = photo.width && photo.height ? `${photo.width} / ${photo.height}` : undefined

  return (
    <Reveal className="photo-columns__item" delay={(photo.index % columns) * 80} style={{ aspectRatio: ratio }}>
      {photo.image ? (
        <img
          className={`photo-columns__image${loaded ? ' photo-columns__image--loaded' : ''}`}
          {...imageSources(photo.image, PHOTO_SIZES)}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading={photo.index < columns * 2 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className={`photo-columns__placeholder photo-columns__placeholder--${photo.index % 4}`} aria-hidden="true" />
      )}
    </Reveal>
  )
}

// Foto disposte su colonne verticali (stile "masonry")
export default function PhotoColumns({ photos, label }) {
  const count = useMediaQuery(MOBILE_QUERY) ? 1 : 3
  const columns = splitIntoColumns(photos, count)

  return (
    <div className="photo-columns">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="photo-columns__column">
          {column.map((photo) => (
            <Photo key={photo.id} photo={photo} columns={count} alt={`${label}, foto ${photo.index + 1} di ${photos.length}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
