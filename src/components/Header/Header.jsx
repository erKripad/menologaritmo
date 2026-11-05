import { Link } from 'react-router'
import logos from '../../config/logos.js'
import LogoMark from '../LogoMark/LogoMark.jsx'
import './Header.css'

function Logo({ src, name, isPartner = false }) {
  return src ? (
    <LogoMark
      src={src}
      alt={name}
      imgClassName={isPartner ? 'header__logo-image header__logo-image--partner' : 'header__logo-image'}
    />
  ) : (
    <span className="header__logo-placeholder">{name.toUpperCase()}</span>
  )
}

// Logo Menologaritmo al centro. Se c'è un partner (es. pagina Radici)
// mostra la collaborazione: Menologaritmo × Partner.
// I file dei loghi si impostano in src/config/logos.js
export default function Header({ partner }) {
  return (
    <header className="header">
      <div className="header__logos">
        <Link to="/" className="header__logo" aria-label="Menologaritmo, torna alla home">
          <Logo src={logos.menologaritmo} name="Menologaritmo" />
        </Link>

        {partner && (
          <>
            <span className="header__times" aria-hidden="true">
              ×
            </span>
            <span className="header__logo">
              <Logo src={partner.logo} name={partner.name} isPartner />
            </span>
          </>
        )}
      </div>
    </header>
  )
}
