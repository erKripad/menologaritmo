import { Link } from 'react-router'
import './Button.css'

// Bottone unico per tutto il sito.
// - to:   link interno (react-router)
// - href: link esterno, mailto, ancora
// - nessuno dei due: <button>
// variant: 'primary' | 'secondary' | 'link'
export default function Button({ to, href, variant = 'primary', className = '', children, ...rest }) {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
