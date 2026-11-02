import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from '../Header/Header.jsx'
import Footer from '../Footer/Footer.jsx'
import './Layout.css'

export default function Layout() {
  const { pathname } = useLocation()

  // Ogni nuova pagina si apre dall'inizio
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
