import './LogoMark.css'

// Mostra un logo nel colore del testo del tema (scuro su sfondo chiaro, chiaro su sfondo scuro).
// Il file fa da maschera: conta solo la sua forma, il colore lo decide il CSS.
// L'<img> trasparente serve solo a dare al logo le sue proporzioni.
export default function LogoMark({ src, alt = '', className = '', imgClassName = '' }) {
  return (
    <span className={`logo-mark ${className}`.trim()} style={{ '--logo-src': `url("${src}")` }}>
      <img className={imgClassName || undefined} src={src} alt={alt} />
    </span>
  )
}
