import Section from '../../components/Section/Section.jsx'
import Reveal from '../../components/Reveal/Reveal.jsx'
import GrowingTree from './components/GrowingTree/GrowingTree.jsx'
import './Radici.css'

// Animazione dell'albero nascosta per ora: per rimetterla basta impostare true.
const SHOW_GROWING_TREE = false

export default function Radici() {
  return (
    <Section fullHeight className="radici" aria-labelledby="radici-title">
      <h1 id="radici-title" className="visually-hidden">
        menologaritmo × Radici
      </h1>
      <div className="container radici__content">
        {SHOW_GROWING_TREE ? (
          <GrowingTree />
        ) : (
          <Reveal as="p" className="title-section radici__soon">
            Coming soon
          </Reveal>
        )}
      </div>
    </Section>
  )
}
