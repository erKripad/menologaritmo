import { Link } from 'react-router'
import Section from '../../../../components/Section/Section.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import Button from '../../../../components/Button/Button.jsx'
import LogoMark from '../../../../components/LogoMark/LogoMark.jsx'
import './ProjectsSection.css'

// Logo cliccabile + "Scopri di più", portano alla pagina del progetto (segnaposto finché manca il file)
function ProjectLogo({ name, to, logo, logoWidth, delay }) {
  return (
    <Reveal className="projects__item" delay={delay}>
      <Link
        to={to}
        className="projects__logo"
        style={logoWidth ? { '--logo-width': logoWidth } : undefined}
        aria-label={`Apri la pagina ${name}`}
      >
        {logo ? <LogoMark src={logo} className="projects__logo-mark" /> : <span className="projects__logo-placeholder">Logo {name}</span>}
      </Link>
      <Button to={to} variant="link" className="projects__more" aria-label={`Scopri di più su ${name}`}>
        Scopri di più
      </Button>
    </Reveal>
  )
}

// Progetti affiancati, separati da una linea verticale: solo loghi e "Scopri di più".
export default function ProjectsSection({ projects }) {
  const [first, second] = projects

  return (
    <Section id="progetti" className="projects" aria-label="Progetti">
      <div className="container projects__row">
        <ProjectLogo {...first} delay={0} />
        <Reveal className="projects__divider" delay={150} aria-hidden="true" />
        <ProjectLogo {...second} delay={250} />
      </div>
    </Section>
  )
}
