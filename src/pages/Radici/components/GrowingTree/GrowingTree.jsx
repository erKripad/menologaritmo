import { useEffect, useId, useRef, useState } from 'react'
import { MAX_GROWTH } from './treeModel.js'
import { createTreeScene, wateringDuration } from './treeScene.js'
import './GrowingTree.css'

function hintFor(stage) {
  if (stage === 0) return 'Clicca per annaffiare'
  if (stage === MAX_GROWTH - 1) return "Un'ultima goccia…"
  return "Ancora un po' d'acqua…"
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Cerchio di avanzamento: si riempie d'acqua (con un'onda) mentre l'albero cresce
function WaterCircle({ id, state, duration }) {
  return (
    <svg className={`water-circle water-circle--${state}`} viewBox="0 0 24 24" style={{ '--fill-duration': `${duration}s` }}>
      <defs>
        <clipPath id={id}>
          <circle cx="12" cy="12" r="8.4" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g className="water-circle__level">
          <path
            className="water-circle__wave"
            d="M-24 4 Q -18 1.5 -12 4 T 0 4 T 12 4 T 24 4 T 36 4 V 30 H -24 Z"
          />
        </g>
      </g>
      <circle className="water-circle__ring" cx="12" cy="12" r="9.5" />
    </svg>
  )
}

// Albero da annaffiare: ogni click inclina l'annaffiatoio e l'albero cresce
// (fusto, rami, foglie e radici). Alla fine compare la scritta "Coming soon".
export default function GrowingTree() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [stage, setStage] = useState(0)
  const [done, setDone] = useState(false)
  const [fillDuration] = useState(() => wateringDuration(prefersReducedMotion()))
  const circleId = useId().replace(/:/g, '')

  useEffect(() => {
    const scene = createTreeScene(canvasRef.current, {
      onComplete: () => setDone(true),
      reducedMotion: prefersReducedMotion(),
    })
    sceneRef.current = scene
    return () => scene.destroy()
  }, [])

  const water = () => {
    if (sceneRef.current?.water()) setStage((current) => current + 1)
  }

  return (
    <div className={`growing-tree${done ? ' is-done' : ''}`}>
      <button
        type="button"
        className="growing-tree__scene"
        onClick={water}
        onPointerEnter={() => sceneRef.current?.setHover(true)}
        onPointerLeave={() => sceneRef.current?.setHover(false)}
        disabled={done}
        aria-label={done ? 'Albero cresciuto' : `Annaffia l'albero (${stage} di ${MAX_GROWTH})`}
      >
        <canvas ref={canvasRef} className="growing-tree__canvas" aria-hidden="true" />
      </button>

      <div className="growing-tree__footer">
        <p className="growing-tree__hint" aria-live="polite">
          {done ? '' : hintFor(stage)}
        </p>
        <div className="growing-tree__progress" aria-hidden="true">
          {Array.from({ length: MAX_GROWTH }, (_, i) => (
            <WaterCircle
              key={i}
              id={`${circleId}-${i}`}
              duration={fillDuration}
              state={i < stage - 1 ? 'full' : i === stage - 1 ? 'filling' : 'empty'}
            />
          ))}
        </div>

        <svg className="growing-tree__soon" viewBox="0 0 640 110" role="img" aria-label="Coming soon" aria-hidden={!done}>
          <text x="320" y="82" textAnchor="middle">
            Coming soon
          </text>
        </svg>
      </div>
    </div>
  )
}
