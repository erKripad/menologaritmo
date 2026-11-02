import AboutSection from './sections/AboutSection/AboutSection.jsx'
import RecentWorks from './sections/RecentWorks/RecentWorks.jsx'
import ProjectSection from './sections/ProjectSection/ProjectSection.jsx'
import logos from '../../config/logos.js'

// I loghi di Radici e Addetti ai lavori si impostano in src/config/logos.js
export default function Home() {
  return (
    <>
      <AboutSection />
      <RecentWorks />
      <ProjectSection
        id="radici"
        title="Radici"
        description="Il progetto nato dalla collaborazione tra Menologaritmo e Radici."
        to="/radici"
        logo={logos.radici}
      />
      <ProjectSection
        id="addetti-ai-lavori"
        title="Addetti ai lavori"
        description="Lo spazio dedicato a chi lavora nella musica, dietro e davanti al palco."
        to="/addetti-ai-lavori"
        logo={logos.addettiAiLavori}
        tone="alt"
      />
    </>
  )
}
