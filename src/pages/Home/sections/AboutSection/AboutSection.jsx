import Section from '../../../../components/Section/Section.jsx'
import Button from '../../../../components/Button/Button.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import { CONTACT_MAILTO } from '../../../../config/contacts.js'
import './AboutSection.css'

// Curva decorativa di y = -log(x), in omaggio al nome. Viene "disegnata" all'apertura.
const CURVE_PATH = Array.from({ length: 121 }, (_, i) => {
  const x = 0.04 + (i / 120) * 7.96
  const px = (i / 120) * 1200
  const py = 420 + 105 * Math.log(x)
  return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`
}).join(' ')

export default function AboutSection() {
  return (
    <Section id="chi-siamo" fullHeight className="about" aria-labelledby="chi-siamo-title">
      <svg className="about__curve" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
        <path d={CURVE_PATH}/>
      </svg>

      <div className="container about__content">
        <Reveal as="h1" id="chi-siamo-title" className="title-hero">
          menologaritmo
        </Reveal>
        <Reveal as="p" className="lead about__lead" delay={150}>
          Un progetto indipendente che porta sul palco artisti musicali emergenti, li aiuta a farsi conoscere dal
          pubblico e a vivere le loro prime esperienze dal vivo.
        </Reveal>
        <Reveal className="about__actions" delay={300}>
          <Button href={CONTACT_MAILTO}>Scrivici</Button>
          <Button href="#lavori-recenti" variant="secondary">
            Lavori recenti
          </Button>
        </Reveal>
      </div>

      <a href="#lavori-recenti" className="about__scroll-hint" aria-label="Scorri ai lavori recenti">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </Section>
  )
}
