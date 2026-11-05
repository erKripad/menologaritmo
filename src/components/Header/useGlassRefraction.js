import { useEffect, useState } from 'react'

// Rifrazione "Liquid Glass": vicino ai bordi il contenuto sotto la barra si piega e si
// allunga come in una lente. Il filtro SVG nel backdrop-filter funziona solo su Chromium.
const supportsRefraction = typeof navigator !== 'undefined' && 'userAgentData' in navigator

export const LENS_SCALE = 96

// band: quanto è larga la fascia distorta; strength: spostamento massimo sul bordo.
// strength negativo: il bordo mostra, compresso, il contenuto appena fuori dalla barra
// (come su iPhone). Positivo: ingrandisce il contenuto interno; va tenuto sotto il 40%
// di band, altrimenti sul bordo il contenuto sparisce. Ai lati la barra tocca lo schermo,
// fuori non c'è niente da mostrare, quindi lì si ingrandisce.
const LENS = {
  bottom: { band: 40, strength: -20 },
  sides: { band: 120, strength: 42 },
}

// Spostamento verso l'interno: nullo all'inizio della fascia, massimo sul bordo.
function lensOffset(distanceFromEdge, { band, strength }) {
  if (distanceFromEdge >= band) return 0
  const t = 1 - distanceFromEdge / band
  return strength * t * t
}

function toChannel(offset) {
  return Math.round(Math.max(0, Math.min(255, 128 + (offset / LENS_SCALE) * 255)))
}

// Mappa della lente in pixel: rosso = spostamento orizzontale, verde = verticale.
function createLensMap(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const image = context.createImageData(width, height)

  const red = new Uint8ClampedArray(width)
  for (let x = 0; x < width; x++) {
    red[x] = toChannel(lensOffset(x, LENS.sides) - lensOffset(width - 1 - x, LENS.sides))
  }

  for (let y = 0; y < height; y++) {
    const green = toChannel(-lensOffset(height - 1 - y, LENS.bottom))
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      image.data[index] = red[x]
      image.data[index + 1] = green
      image.data[index + 2] = 128
      image.data[index + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

// Chrome costruisce il filtro una volta sola: se la mappa non è ancora caricata la lente
// non si vede. Quindi si carica prima la mappa e poi si attiva il filtro, con un id nuovo
// a ogni cambio di misura così Chrome lo ricostruisce.
export default function useGlassRefraction(width, height) {
  const [lens, setLens] = useState(null)

  useEffect(() => {
    if (!supportsRefraction || !width || !height) return
    let cancelled = false
    const href = createLensMap(width, height)
    const image = new Image()
    image.src = href
    image
      .decode()
      .then(() => {
        if (!cancelled) setLens({ id: `header-glass-${width}x${height}`, href, width, height })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [width, height])

  return lens
}
