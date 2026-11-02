import AboutSection from './sections/AboutSection/AboutSection.jsx'
import RecentWorks from './sections/RecentWorks/RecentWorks.jsx'
import ProjectSection from './sections/ProjectSection/ProjectSection.jsx'

// LOGHI: quando li hai, mettili in src/assets/logos/ e importali qui, ad esempio:
//   import radiciLogo from '../../assets/logos/radici.svg'
//   import addettiLogo from '../../assets/logos/addetti-ai-lavori.svg'
// poi passali sotto con  logo={radiciLogo}  e  logo={addettiLogo}
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
        logo={null}
      />
      <ProjectSection
        id="addetti-ai-lavori"
        title="Addetti ai lavori"
        description="Lo spazio dedicato a chi lavora nella musica, dietro e davanti al palco."
        to="/addetti-ai-lavori"
        logo={null}
        tone="alt"
      />
    </>
  )
}
