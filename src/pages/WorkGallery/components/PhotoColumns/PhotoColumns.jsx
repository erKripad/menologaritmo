import { useState } from 'react'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import './PhotoColumns.css'

const COLUMNS = 3

// Ogni foto va nella colonna più corta finora: le colonne restano pari e l'ordine
// si legge da sinistra a destra, dall'alto in basso.
function splitIntoColumns(photos) {
  const columns = Array.from({ length: COLUMNS }, () => ({ height: 0, photos: [] }))
  photos.forEach((photo, index) => {
    const ratio = photo.width && photo.height ? photo.height / photo.width : 1
    const shortest = columns.reduce((best, column) => (column.height < best.height ? column : best))
    shortest.height += ratio
    shortest.photos.push({ ...photo, index })
  })
  return columns.map((column) => column.photos)
}

function Photo({ photo, alt }) {
  const [loaded, setLoaded] = useState(false)
  const ratio = photo.width && photo.height ? `${photo.width} / ${photo.height}` : undefined

  return (
    <Reveal className="photo-columns__item" delay={(photo.index % COLUMNS) * 80} style={{ aspectRatio: ratio }}>
      {photo.image ? (
        <img
          className={`photo-columns__image${loaded ? ' photo-columns__image--loaded' : ''}`}
          src={photo.image}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading={photo.index < COLUMNS * 2 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className={`photo-columns__placeholder photo-columns__placeholder--${photo.index % 4}`} aria-hidden="true" />
      )}
    </Reveal>
  )
}

// Foto disposte su tre colonne verticali (stile "masonry")
export default function PhotoColumns({ photos, label }) {
  const columns = splitIntoColumns(photos)

  return (
    <div className="photo-columns">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="photo-columns__column">
          {column.map((photo) => (
            <Photo key={photo.id} photo={photo} alt={`${label}, foto ${photo.index + 1} di ${photos.length}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
