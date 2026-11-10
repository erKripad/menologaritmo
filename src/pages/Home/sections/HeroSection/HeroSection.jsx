import Section from '../../../../components/Section/Section.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import GlassLens from '../../../../components/GlassLens/GlassLens.jsx'
import './HeroSection.css'

// Apertura della home: solo il nome, a tutto schermo, e la freccia che indica che sotto
// ci sono altre sezioni. Passandoci sopra col mouse una palla di vetro deforma le lettere.
export default function HeroSection() {
  return (
    <Section fullHeight className="hero" aria-label="menologaritmo">
      <div className="container">
        <Reveal as="h1" className="title-hero">
          <GlassLens>menologaritmo</GlassLens>
        </Reveal>
      </div>

      <a href="#chi-siamo" className="hero__scroll-hint" aria-label="Scorri a Chi siamo">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </Section>
  )
}
