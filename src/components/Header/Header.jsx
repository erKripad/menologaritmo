import { useRef } from 'react'
import { Link } from 'react-router'
import logos from '../../config/logos.js'
import LogoMark from '../LogoMark/LogoMark.jsx'
import useElementSize from '../../hooks/useElementSize.js'
import GlassFilter from './GlassFilter.jsx'
import useGlassRefraction from './useGlassRefraction.js'
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

// Logo menologaritmo al centro. Se c'è un partner (es. pagina Radici)
// mostra la collaborazione: menologaritmo × Partner.
// I file dei loghi si impostano in src/config/logos.js
export default function Header({ partner }) {
  const headerRef = useRef(null)
  const size = useElementSize(headerRef)
  const lens = useGlassRefraction(size?.width, size?.height)

  return (
    <header
      ref={headerRef}
      className={`header${lens ? ' header--refraction' : ''}`}
      style={lens ? { '--glass-filter': `url(#${lens.id})` } : undefined}
    >
      {lens && <GlassFilter {...lens} />}
      <div className="header__logos">
        <Link to="/" className="header__logo" aria-label="menologaritmo, torna alla home">
          <Logo src={logos.menologaritmo} name="menologaritmo" />
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
