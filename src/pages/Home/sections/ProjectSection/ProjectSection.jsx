import { Link } from 'react-router'
import Section from '../../../../components/Section/Section.jsx'
import Button from '../../../../components/Button/Button.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import './ProjectSection.css'

// Sezione della Home che presenta un progetto con il suo logo cliccabile
// che porta alla pagina dedicata. Usata per "Radici" e "Addetti ai lavori".
export default function ProjectSection({ id, title, description, to, logo, tone }) {
  const titleId = `${id}-title`

  return (
    <Section id={id} tone={tone} className="project-section" aria-labelledby={titleId}>
      <div className="container">
        <Reveal as="h2" id={titleId} className="title-section">
          {title}
        </Reveal>
        <Reveal as="p" className="lead project-section__lead" delay={100}>
          {description}
        </Reveal>

        <Reveal delay={200}>
          <Link to={to} className="project-section__logo" aria-label={`Apri la pagina ${title}`}>
            {logo ? (
              <img src={logo} alt="" />
            ) : (
              <span className="project-section__logo-placeholder">Logo {title}</span>
            )}
          </Link>
        </Reveal>

        <Reveal delay={300}>
          <Button to={to} variant="link">
            Scopri di più
          </Button>
        </Reveal>
      </div>
    </Section>
  )
}
