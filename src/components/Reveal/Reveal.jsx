import useInView from '../../hooks/useInView.js'
import './Reveal.css'

// Fa comparire il contenuto con una dissolvenza dal basso quando entra nello schermo.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const [ref, inView] = useInView()
  const classes = ['reveal', inView && 'reveal--visible', className].filter(Boolean).join(' ')

  return (
    <Tag ref={ref} className={classes} style={{ ...style, '--reveal-delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}
