import { Link } from 'react-router'
import './Header.css'

// Logo: per ora è un placeholder testuale.
// Quando hai il file, mettilo in src/assets/logos/menologaritmo.svg
// e sostituisci lo <span> con: <img src={logo} alt="Menologaritmo" />
export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo" aria-label="Menologaritmo, home">
        <span className="header__logo-placeholder">MENOLOGARITMO</span>
      </Link>
    </header>
  )
}
