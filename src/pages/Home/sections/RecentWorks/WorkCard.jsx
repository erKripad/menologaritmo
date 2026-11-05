import './WorkCard.css'

// variant: numero della slide, usato solo per variare lo sfondo segnaposto
export default function WorkCard({ work, variant = 0 }) {
  return (
    <article className="work-card">
      {work.image ? (
        <img className="work-card__media" src={work.image} alt={`${work.artist}, ${work.venue}`} loading="lazy" />
      ) : (
        <div className={`work-card__media work-card__placeholder work-card__placeholder--${variant % 5}`} aria-hidden="true" />
      )}

      {work.artist && (
        <div className="work-card__overlay">
          <p className="work-card__meta">
            {work.date} · {work.venue}
          </p>
          <h3 className="work-card__title">{work.artist}</h3>
        </div>
      )}
    </article>
  )
}
