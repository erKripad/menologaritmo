import { useCallback, useEffect, useRef, useState } from 'react'
import './Carousel.css'

const SWIPE_THRESHOLD = 50

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Carosello stile "Apple TV" della home di apple.com:
// la slide attiva è al centro, le vicine si intravedono ai lati, scorre all'infinito.
// Le slide vengono ripetute 3 volte: a fine animazione, se si esce dalla copia centrale,
// si torna alla posizione equivalente senza animazione (salto invisibile).
export default function Carousel({ items, renderItem, getKey, label, interval = 6000 }) {
  const count = items.length
  const [position, setPosition] = useState(count)
  const [animated, setAnimated] = useState(true)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const [focused, setFocused] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)
  // Cresce a ogni cambio di slide (automatico, swipe, pallino, freccia): fa ripartire il timer
  // e la barra di avanzamento. Il salto invisibile tra le copie non lo cambia.
  const [step, setStep] = useState(0)
  const touchStartX = useRef(null)
  const playButton = useRef(null)

  const active = position % count
  const running = playing && !focused && !pageHidden && count > 1

  const goTo = useCallback(
    (target) => {
      setAnimated(true)
      setStep((current) => current + 1)
      setPosition(Math.max(0, Math.min(target, count * 3 - 1)))
    },
    [count],
  )

  const next = useCallback(() => {
    setAnimated(true)
    setStep((current) => current + 1)
    setPosition((current) => Math.min(current + 1, count * 3 - 1))
  }, [count])

  const previous = useCallback(() => {
    setAnimated(true)
    setStep((current) => current + 1)
    setPosition((current) => Math.max(current - 1, 0))
  }, [])

  // Autoplay: il conto alla rovescia riparte da zero a ogni cambio di slide
  useEffect(() => {
    if (!running) return
    const id = setTimeout(next, interval)
    return () => clearTimeout(id)
  }, [running, next, interval, step])

  // Pausa quando la scheda del browser non è visibile
  useEffect(() => {
    const onVisibilityChange = () => setPageHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Riattiva la transizione dopo il salto invisibile
  useEffect(() => {
    if (animated) return
    let innerId
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => setAnimated(true))
    })
    return () => {
      cancelAnimationFrame(outerId)
      cancelAnimationFrame(innerId)
    }
  }, [animated])

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (position < count || position >= count * 2) {
      setAnimated(false)
      setPosition(count + active)
    }
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -SWIPE_THRESHOLD) next()
    else if (delta > SWIPE_THRESHOLD) previous()
  }

  // Ferma lo scorrimento solo se si arriva con la tastiera (Tab) su un elemento del carosello.
  // Un clic col mouse non conta, e nemmeno il bottone pausa/riproduci: altrimenti, dopo averlo
  // premuto, il carosello resterebbe fermo pur mostrando "in riproduzione".
  const handleFocus = (event) => {
    setFocused(event.target !== playButton.current && event.target.matches(':focus-visible'))
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') next()
    else if (event.key === 'ArrowLeft') previous()
  }

  const slides = [...items, ...items, ...items]

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carosello"
      aria-label={label}
      style={{ '--position': position, '--interval': `${interval}ms` }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="carousel__viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <ul
          className={`carousel__track${animated ? ' carousel__track--animated' : ''}`}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((item, index) => {
            const isActive = index === position
            return (
              <li
                key={`${Math.floor(index / count)}-${getKey(item)}`}
                className={`carousel__slide${isActive ? ' carousel__slide--active' : ''}`}
                aria-roledescription="slide"
                aria-label={`${(index % count) + 1} di ${count}`}
                aria-hidden={!isActive}
                onClick={isActive ? undefined : () => goTo(index)}
              >
                {renderItem(item, isActive)}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="carousel__controls">
        <div className="carousel__dots">
          {items.map((item, index) => {
            const isActive = index === active
            return (
              <button
                key={getKey(item)}
                type="button"
                className={`carousel__dot${isActive ? ' carousel__dot--active' : ''}`}
                aria-label={`Vai alla slide ${index + 1}`}
                aria-current={isActive}
                onClick={() => goTo(position - active + index)}
              >
                <span className="carousel__dot-bar">
                  {isActive && (
                    <span
                      key={`${step}-${running}`}
                      className={`carousel__dot-fill${running ? ' carousel__dot-fill--running' : ''}`}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <button
          ref={playButton}
          type="button"
          className="carousel__play"
          aria-label={playing ? 'Metti in pausa' : 'Riproduci'}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
