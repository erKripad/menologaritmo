import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from '../Header/Header.jsx'
import Footer from '../Footer/Footer.jsx'
import logos from '../../config/logos.js'
import './Layout.css'

// Pagine in cui l'header mostra la collaborazione con un partner
const HEADER_PARTNERS = {
  '/radici': { name: 'Radici', logo: logos.radici },
}

export default function Layout() {
  const { pathname, state } = useLocation()
  const scrollTarget = state?.scrollTo

  // Ogni nuova pagina si apre dall'inizio, oppure sulla sezione indicata
  // (es. dalla galleria si torna direttamente al carosello dei lavori recenti)
  useEffect(() => {
    const target = scrollTarget && document.getElementById(scrollTarget)
    if (target) target.scrollIntoView({ behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, scrollTarget])

  return (
    <div className="layout">
      <Header partner={HEADER_PARTNERS[pathname]} />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
