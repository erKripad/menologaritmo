import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import LiquidGlass from 'liquid-glass-react'
import logos from '../../config/logos.js'
import LogoMark from '../LogoMark/LogoMark.jsx'
import './Header.css'

// Parametri del riquadro "User Info" della demo di liquid-glass-react
// (https://liquid-glass.maxrovensky.com), con la sfocatura più bassa (blurAmount 0.2).
// Due differenze obbligate dalla barra a tutta larghezza:
// - mode "shader" invece di "standard": la mappa standard è un'immagine fissa pensata per
//   un riquadro, su una barra larga sposta il contenuto di ~30px. Shader la genera alla
//   misura della barra: al centro non sposta niente, piega il contenuto vicino ai bordi.
// - cornerRadius 0 invece di 32: la barra tocca i bordi dello schermo.
const GLASS = {
  mode: 'shader',
  displacementScale: 100,
  blurAmount: 0.2,
  saturation: 140,
  aberrationIntensity: 2,
  elasticity: 0,
  cornerRadius: 0,
  padding: '0',
}

// Barra fissa in alto, alta --header-height. top/left in px: con 0 la libreria rimette 50%.
const GLASS_STYLE = { position: 'fixed', top: '0px', left: '0px', width: '100%', height: 'var(--header-height)' }

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

// Logo menologaritmo al centro, in una barra di vetro "Liquid Glass".
// Se c'è un partner (es. pagina Radici) mostra la collaborazione: menologaritmo × Partner.
// I file dei loghi si impostano in src/config/logos.js
// La rifrazione sui bordi si vede solo su Chromium: Safari e Firefox mostrano il vetro sfocato.
// hidden: la barra esce in alto (es. nell'apertura della home, dove la scritta fa già da logo).
export default function Header({ partner, hidden = false }) {
  // La barra scivola solo dopo il primo disegno: aprendo la home è già nascosta, senza
  // vederla uscire
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    let frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => setAnimated(true))))
    return () => cancelAnimationFrame(frame)
  }, [])

  const classes = ['header', animated && 'header--animated', hidden && 'header--hidden'].filter(Boolean).join(' ')

  return (
    <header className={classes}>
      <LiquidGlass className="header__glass" style={GLASS_STYLE} {...GLASS}>
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
      </LiquidGlass>
    </header>
  )
}
