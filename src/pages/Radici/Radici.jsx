import Section from '../../components/Section/Section.jsx'
import GrowingTree from './components/GrowingTree/GrowingTree.jsx'
import './Radici.css'

export default function Radici() {
  return (
    <Section fullHeight className="radici" aria-labelledby="radici-title">
      <h1 id="radici-title" className="visually-hidden">
        Menologaritmo × Radici
      </h1>
      <div className="container radici__content">
        <GrowingTree />
      </div>
    </Section>
  )
}
