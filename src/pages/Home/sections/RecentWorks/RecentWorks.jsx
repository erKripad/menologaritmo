import Section from '../../../../components/Section/Section.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import Carousel from '../../../../components/Carousel/Carousel.jsx'
import WorkCard from './WorkCard.jsx'
import recentWorks from './recentWorks.js'
import './RecentWorks.css'

export default function RecentWorks() {
  return (
    <Section id="lavori-recenti" tone="alt" className="recent-works" aria-labelledby="lavori-recenti-title">
      <div className="container recent-works__header">
        <Reveal as="p" className="eyebrow">
          Lavori recenti
        </Reveal>
        <Reveal as="h2" id="lavori-recenti-title" className="title-section" delay={100}>
          Sul palco, di recente.
        </Reveal>
      </div>

      <Reveal delay={200}>
        <Carousel
          items={recentWorks}
          getKey={(work) => work.id}
          label="Lavori recenti"
          renderItem={(work) => <WorkCard work={work} variant={recentWorks.indexOf(work)} />}
        />
      </Reveal>
    </Section>
  )
}
