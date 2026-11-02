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
  const { pathname } = useLocation()

  // Ogni nuova pagina si apre dall'inizio
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

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
