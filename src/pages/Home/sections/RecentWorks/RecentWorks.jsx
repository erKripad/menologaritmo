import Section from '../../../../components/Section/Section.jsx'
import Reveal from '../../../../components/Reveal/Reveal.jsx'
import Carousel from '../../../../components/Carousel/Carousel.jsx'
import WorkCard from './WorkCard.jsx'
import useRecentWorks from './useRecentWorks.js'
import './RecentWorks.css'

export default function RecentWorks() {
  const { status, works } = useRecentWorks()

  return (
    <Section id="lavori-recenti" tone="alt" className="recent-works" aria-labelledby="lavori-recenti-title">
      <div className="container recent-works__header">
        <Reveal as="h2" id="lavori-recenti-title" className="title-section">
          Sul palco, di recente.
        </Reveal>
      </div>

      <Reveal delay={100} aria-busy={status === 'loading'}>
        {status === 'empty' ? (
          <p className="container recent-works__empty">Le foto dei prossimi concerti arriveranno presto.</p>
        ) : (
          <Carousel
            key={status}
            items={works}
            getKey={(work) => work.id}
            label="Lavori recenti"
            renderItem={(work) => <WorkCard work={work} variant={works.indexOf(work)} />}
          />
        )}
      </Reveal>
    </Section>
  )
}
