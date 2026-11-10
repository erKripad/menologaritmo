import { useEffect, useId, useRef, useState } from 'react'
import { createLensImages, IMAGE_RATIO } from './lensMap.js'
import './GlassLens.css'

// Raggio della palla rispetto alla dimensione del testo (0.9 → diametro di 1,8 volte il font)
const LENS_SIZE = 0.9
// Frange colorate, stessa scala di aberrationIntensity di liquid-glass-react: il verde si
// sposta del 5% in più del rosso per ogni punto, il blu del 10%. 0 = niente frange.
const ABERRATION = 5
// Bordo irregolare: quanto si deforma la palla (rispetto al raggio)
const WOBBLE = 0.6
// Il bordo ondeggia anche a mouse fermo: la deformazione gira su un ciclo di WOBBLE_LOOP
// millisecondi, ampio WOBBLE_DRIFT (rispetto al raggio). Spostando la palla cambia ancora.
const WOBBLE_LOOP = 5000
const WOBBLE_DRIFT = 0.4
// Quanto in fretta la palla raggiunge il mouse e compare/scompare (0–1 per fotogramma)
const FOLLOW = 0.22
const FADE = 0.14

const CHANNELS = [
  { name: 'r', shift: 0, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'g', shift: 0.05, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'b', shift: 0.1, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
]

// Maschere del bordo (immagine rim): l'opacità viene dal rosso (linea) o dal verde (riflesso),
// moltiplicata per quanto è visibile la palla
const maskFromRed = (strength) => `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${strength} 0 0 0 0`
const maskFromGreen = (strength) => `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 ${strength} 0 0 0`

// Spazio attorno al testo dove la palla può arrivare (immagine, deformazione e ondeggiamento)
const stagePadding = (radius) => Math.ceil(radius * (IMAGE_RATIO + WOBBLE + WOBBLE_DRIFT))

// Palla di vetro che segue il mouse quando passa sopra il testo: le lettere sotto si
// ingrandiscono e si piegano, il bordo è irregolare, ondeggia e si vede (linea sottile e
// riflesso di luce). Solo distorsione, nessuna sfocatura.
// Filtro SVG applicato al testo stesso, nessuna libreria. Solo con il mouse: sul touch non
// c'è un "passare sopra".
export default function GlassLens({ children }) {
  const baseId = useId()
  const stageRef = useRef(null)
  const textRef = useRef(null)
  const filterRef = useRef(null)
  const lensRef = useRef(null)
  const motion = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, target: 0, frame: 0 })
  const [lens, setLens] = useState(null)

  // Il raggio segue la dimensione del testo, che cambia con la larghezza della finestra
  useEffect(() => {
    const text = textRef.current
    const observer = new ResizeObserver(() => {
      const radius = Math.round(parseFloat(getComputedStyle(text).fontSize) * LENS_SIZE)
      setLens((current) =>
        current?.radius === radius
          ? current
          : // Chrome costruisce il filtro una volta sola: id nuovo a ogni immagine nuova
            { radius, id: `${baseId}-${radius}`, ...createLensImages(radius) },
      )
    })
    observer.observe(text)
    return () => observer.disconnect()
  }, [baseId])

  useEffect(() => {
    lensRef.current = lens
  }, [lens])

  useEffect(() => () => cancelAnimationFrame(motion.current.frame), [])

  // Aggiorna il filtro direttamente, senza ridisegnare il componente a ogni fotogramma
  function apply(time) {
    const m = motion.current
    const { radius, id, scale, size } = lensRef.current
    const filter = filterRef.current
    const node = (name) => filter.querySelector(`[data-node="${name}"]`)
    const setAll = (element, values) => Object.entries(values).forEach(([key, value]) => element.setAttribute(key, value))

    const left = m.x - size / 2
    const top = m.y - size / 2
    const wobble = radius * WOBBLE
    // Riquadro della palla: i calcoli pesanti si fanno solo qui, fuori resta il testo com'è
    const box = { x: left - wobble, y: top - wobble, width: size + wobble * 2, height: size + wobble * 2 }

    setAll(node('map'), { x: left, y: top })
    setAll(node('rim'), { x: left, y: top })
    filter.querySelectorAll('[data-box]').forEach((element) => setAll(element, box))

    // Il rumore che deforma il bordo si calcola in un punto che gira su un cerchio e poi si
    // riporta sopra la palla: la forma cambia di continuo, senza scatti
    const turn = ((time % WOBBLE_LOOP) / WOBBLE_LOOP) * 2 * Math.PI
    const driftX = Math.cos(turn) * radius * WOBBLE_DRIFT
    const driftY = Math.sin(turn) * radius * WOBBLE_DRIFT
    setAll(node('noise'), { ...box, x: box.x + driftX, y: box.y + driftY })
    setAll(node('noise-back'), { dx: -driftX, dy: -driftY })
    node('map-wobble').setAttribute('scale', wobble)
    node('rim-wobble').setAttribute('scale', wobble)

    CHANNELS.forEach(({ name, shift }) =>
      node(`${name}-moved`).setAttribute('scale', m.strength * scale * (1 + shift * ABERRATION)),
    )
    node('edge').setAttribute('values', maskFromRed(m.strength))
    node('shine').setAttribute('values', maskFromGreen(m.strength))

    // A palla spenta niente filtro: il testo resta identico all'originale
    stageRef.current.style.filter = m.strength > 0.001 ? `url(#${id})` : ''
  }

  function tick(time) {
    const m = motion.current
    m.x += (m.targetX - m.x) * FOLLOW
    m.y += (m.targetY - m.y) * FOLLOW
    m.strength += (m.target - m.strength) * FADE
    // La palla ondeggia finché è visibile; ci si ferma solo quando è sparita
    const gone = m.target === 0 && m.strength < 0.002
    if (gone) m.strength = 0
    apply(time)
    m.frame = gone ? 0 : requestAnimationFrame(tick)
  }

  function follow(event, target) {
    if (event.pointerType === 'touch' || !lensRef.current) return
    const m = motion.current
    const rect = stageRef.current.getBoundingClientRect()
    m.targetX = event.clientX - rect.left
    m.targetY = event.clientY - rect.top
    // La palla compare dove si trova il mouse, non scivola dalla posizione precedente
    if (m.strength < 0.01) {
      m.x = m.targetX
      m.y = m.targetY
    }
    if (target !== undefined) m.target = target
    if (!m.frame) m.frame = requestAnimationFrame(tick)
  }

  return (
    <span
      ref={stageRef}
      className={lens ? 'glass-lens glass-lens--ready' : 'glass-lens'}
      style={lens ? { '--glass-lens-padding': `${stagePadding(lens.radius)}px` } : undefined}
    >
      <span
        ref={textRef}
        className="glass-lens__text"
        onPointerEnter={(event) => follow(event, 1)}
        onPointerMove={(event) => follow(event)}
        onPointerLeave={(event) => follow(event, 0)}
      >
        {children}
      </span>

      {lens && (
        <svg className="glass-lens__filter" aria-hidden="true" focusable="false">
          <filter
            ref={filterRef}
            id={lens.id}
            x="0"
            y="0"
            width="1"
            height="1"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            {/* Rumore che rende il bordo irregolare e lo fa ondeggiare */}
            <feTurbulence data-node="noise" type="fractalNoise" baseFrequency={1 / lens.radius} numOctaves="1" seed="4" result="noise-moved" />
            <feOffset data-node="noise-back" data-box in="noise-moved" result="noise" />

            {/* Mappa della palla deformata dal rumore, ferma (grigio) fuori dalla palla */}
            <feFlood data-box floodColor="rgb(128 128 128)" result="still" />
            <feImage data-node="map" href={lens.map} width={lens.size} height={lens.size} result="map-raw" />
            <feDisplacementMap data-node="map-wobble" data-box in="map-raw" in2="noise" xChannelSelector="R" yChannelSelector="G" result="map-wobbly" />
            {/* Chrome deforma la mappa "a pixel": la si ammorbidisce un poco, se no le lettere
                hanno i bordi granulosi. Si ammorbidisce la mappa, non il testo (che resta nitido). */}
            <feGaussianBlur data-box in="map-wobbly" stdDeviation="1.5" result="map-smooth" />
            <feComposite data-box in="map-smooth" in2="still" operator="over" result="map" />

            {/* Testo visto attraverso la palla: rosso, verde e blu spostati un po' diversamente */}
            {CHANNELS.flatMap(({ name, matrix }) => [
              <feDisplacementMap
                key={`${name}-moved`}
                data-node={`${name}-moved`}
                data-box
                in="SourceGraphic"
                in2="map"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
                result={`${name}-moved`}
              />,
              <feColorMatrix key={name} data-box in={`${name}-moved`} type="matrix" values={matrix} result={name} />,
            ])}
            <feBlend data-box in="r" in2="g" mode="screen" result="rg" />
            <feBlend data-box in="rg" in2="b" mode="screen" result="glass" />

            {/* Bordo visibile, deformato dallo stesso rumore: linea sottile e riflesso */}
            <feImage data-node="rim" href={lens.rim} width={lens.size} height={lens.size} result="rim-raw" />
            <feDisplacementMap data-node="rim-wobble" data-box in="rim-raw" in2="noise" xChannelSelector="R" yChannelSelector="G" result="rim" />
            <feColorMatrix data-node="edge" data-box in="rim" type="matrix" values={maskFromRed(0)} result="edge-mask" />
            <feFlood data-box className="glass-lens__edge" result="edge-color" />
            <feComposite data-box in="edge-color" in2="edge-mask" operator="in" result="edge" />
            <feColorMatrix data-node="shine" data-box in="rim" type="matrix" values={maskFromGreen(0)} result="shine-mask" />
            <feFlood data-box className="glass-lens__shine" result="shine-color" />
            <feComposite data-box in="shine-color" in2="shine-mask" operator="in" result="shine" />

            {/* Testo normale ovunque, la palla sopra */}
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="glass" />
              <feMergeNode in="edge" />
              <feMergeNode in="shine" />
            </feMerge>
          </filter>
        </svg>
      )}
    </span>
  )
}
