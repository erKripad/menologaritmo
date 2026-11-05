import AboutSection from './sections/AboutSection/AboutSection.jsx'
import RecentWorks from './sections/RecentWorks/RecentWorks.jsx'
import ProjectsSection from './sections/ProjectsSection/ProjectsSection.jsx'
import ContactSection from './sections/ContactSection/ContactSection.jsx'
import logos from '../../config/logos.js'

// I loghi di Radici e Addetti ai lavori si impostano in src/config/logos.js
// Ordine: il primo va a sinistra, il secondo a destra
// logoWidth: larghezza del logo dentro il cerchio. Radici è largo e basso, quindi
// gli serve più larghezza; Addetti ai lavori resta comunque leggermente più grande.
const PROJECTS = [
  { name: 'Addetti ai lavori', to: '/addetti-ai-lavori', logo: logos.addettiAiLavori, logoWidth: '80%' },
  { name: 'Radici', to: '/radici', logo: logos.radici, logoWidth: '88%' },
]

export default function Home() {
  return (
    <>
      <AboutSection />
      <RecentWorks />
      <ProjectsSection projects={PROJECTS} />
      <ContactSection />
    </>
  )
}
