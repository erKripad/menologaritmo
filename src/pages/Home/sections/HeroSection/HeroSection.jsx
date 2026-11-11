import { useRef } from 'react'
import Section from '../../../../components/Section/Section.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import GlassLens from '../../../../components/GlassLens/GlassLens.jsx'
import useHideHeaderWhileVisible from '../../../../hooks/useHideHeaderWhileVisible.js'
import './HeroSection.css'

// Apertura della home: solo il nome, a tutto schermo, e la freccia che indica che sotto
// ci sono altre sezioni. Passandoci sopra col mouse (o col dito) una palla di vetro deforma
// le lettere. Finché la scritta si vede l'header resta nascosto.
export default function HeroSection() {
  const titleRef = useRef(null)
  useHideHeaderWhileVisible(titleRef)

  return (
    <Section fullHeight className="hero" aria-label="menologaritmo">
      <div ref={titleRef} className="container">
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
