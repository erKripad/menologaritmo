import { Link } from 'react-router'
import imageSources from '../../../../utils/imageSources.js'
import './WorkCard.css'

// Larghezza della card nel carosello (vedi Carousel.css)
const CARD_SIZES = '(max-width: 734px) 86vw, (max-width: 1068px) 84vw, min(1000px, 80vw)'

// variant: numero della slide, usato solo per variare lo sfondo segnaposto.
// linked: la card porta alla galleria dell'evento (solo la slide al centro del carosello).
export default function WorkCard({ work, variant = 0, linked = false }) {
  const content = (
    <>
      {work.image ? (
        <img
          className="work-card__media"
          {...imageSources(work.image, CARD_SIZES)}
          alt={`${work.artist}, ${work.venue}`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`work-card__media work-card__placeholder work-card__placeholder--${variant % 5}`} aria-hidden="true" />
      )}

      {work.artist && (
        <div className="work-card__overlay">
          <p className="work-card__meta">
            {work.date} · {work.venue}
          </p>
          <h3 className="work-card__title">{work.artist}</h3>
          {linked && <span className="work-card__more">Guarda le foto</span>}
        </div>
      )}
    </>
  )

  if (linked && work.artist && work.slug) {
    return (
      <Link
        to={`/lavori-recenti/${work.slug}`}
        className="work-card work-card--linked"
        aria-label={`Guarda le foto di ${work.artist}, ${work.venue}`}
      >
        {content}
      </Link>
    )
  }

  return <article className="work-card">{content}</article>
}
