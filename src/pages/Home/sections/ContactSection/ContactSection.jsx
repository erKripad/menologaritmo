import Section from '../../../../components/Section/Section.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import Button from '../../../../components/Button/Button.jsx'
import { CONTACT_MAILTO } from '../../../../config/contacts.js'
import './ContactSection.css'

// Ultima sezione della Home: domanda a sinistra, bottone "Contattaci" a destra
export default function ContactSection() {
  return (
    <Section id="contatti" tone="alt" centered={false} className="contact" aria-labelledby="contatti-title">
      <div className="container contact__row">
        <Reveal as="h2" id="contatti-title" className="contact__title">
          Hai qualche idea, qualche progetto da proporre o ti piacerebbe fare qualcosa insieme?
        </Reveal>
        <Reveal className="contact__action" delay={150}>
          <Button href={CONTACT_MAILTO}>Contattaci</Button>
        </Reveal>
      </div>
    </Section>
  )
}
