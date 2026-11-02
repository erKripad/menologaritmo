import './Section.css'

// Blocco a tutta larghezza della pagina (stile "tile" di apple.com).
// tone: 'default' | 'alt' alterna lo sfondo tra sezioni consecutive.
export default function Section({ id, tone = 'default', fullHeight = false, centered = true, className = '', children, ...rest }) {
  const classes = [
    'section',
    `section--${tone}`,
    fullHeight && 'section--full-height',
    centered && 'section--centered',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section id={id} className={classes} {...rest}>
      {children}
    </section>
  )
}
