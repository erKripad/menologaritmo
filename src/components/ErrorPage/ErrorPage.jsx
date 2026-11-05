import Section from '../Section/Section.jsx'
import Reveal from '../Reveal/Reveal.jsx'
import './ErrorPage.css'

// Pagina di errore con lo stile della Home: codice, titolo, spiegazione e azioni.
export default function ErrorPage({ code, title, message, children }) {
  return (
    <Section fullHeight className="error-page" aria-labelledby="error-page-title">
      <div className="container error-page__content">
        <Reveal as="p" className="eyebrow">
          {code}
        </Reveal>
        <Reveal as="h1" id="error-page-title" className="title-hero error-page__title" delay={100}>
          {title}
        </Reveal>
        <Reveal as="p" className="lead error-page__lead" delay={250}>
          {message}
        </Reveal>
        <Reveal className="error-page__actions" delay={400}>
          {children}
        </Reveal>
      </div>
    </Section>
  )
}
