import Section from '../../../../components/Section/Section.jsx'
import Button from '../../../../components/Button/Button.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import { CONTACT_MAILTO } from '../../../../config/contacts.js'
import './AboutSection.css'

export default function AboutSection() {
  return (
    <Section id="chi-siamo" tone="alt" className="about" aria-labelledby="chi-siamo-title">
      <div className="container">
        <Reveal as="h2" id="chi-siamo-title" className="title-section">
          Chi siamo
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
    </Section>
  )
}
