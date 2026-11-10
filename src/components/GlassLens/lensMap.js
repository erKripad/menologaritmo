// Immagini della palla di vetro, generate con un canvas alla misura della lente.
//
// map: dice al filtro (feDisplacementMap) dove spostare ogni punto. Rosso = spostamento
//   orizzontale, verde = verticale (128 = fermo). Ogni punto mostra il contenuto di un punto
//   più vicino al centro: al centro la palla ingrandisce, verso il bordo comprime; sul bordo
//   mostra ancora il contenuto di dentro, quindi il bordo "stacca" come in una palla vera.
//   Fuori dalla palla è trasparente (nessuno spostamento).
// rim: maschere del bordo visibile. Rosso = linea sottile sul bordo, più marcata dal lato in
//   ombra (in basso a destra); verde = riflesso di luce in alto a sinistra, che sborda un po'
//   fuori dalla palla. I colori li decide il CSS (GlassLens.css).

// Ingrandimento al centro = 1 / CENTER_ZOOM (0.45 → circa 2,2 volte)
const CENTER_ZOOM = 0.45
// Sul bordo la palla mostra il contenuto che sta all'EDGE_ZOOM del raggio (1 = nessuno stacco)
const EDGE_ZOOM = 0.8
// Il riflesso sborda fuori dalla palla: l'immagine è più grande del diametro
export const IMAGE_RATIO = 1.25

const LIGHT_ANGLE = (-3 * Math.PI) / 4 // luce da in alto a sinistra (y verso il basso)

// Distanza dal centro del punto da mostrare, in raggi, per un punto a distanza t
function sampledRadius(t) {
  return t * (CENTER_ZOOM + (EDGE_ZOOM - CENTER_ZOOM) * t * t)
}

const gauss = (x, center, width) => Math.exp(-(((x - center) / width) ** 2))

export function createLensImages(radius) {
  const half = Math.ceil(radius * IMAGE_RATIO)
  const size = half * 2

  // "scale" da dare a feDisplacementMap a palla piena: il doppio dello spostamento massimo,
  // così lo spostamento massimo corrisponde al rosso/verde pieno
  let maxShift = 0
  for (let t = 0; t <= 1; t += 0.01) maxShift = Math.max(maxShift, radius * (t - sampledRadius(t)))
  const scale = maxShift * 2

  const map = new ImageData(size, size)
  const rim = new ImageData(size, size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - half
      const dy = y + 0.5 - half
      const t = Math.hypot(dx, dy) / radius
      const angle = Math.atan2(dy, dx)
      const index = (y * size + x) * 4

      if (t < 1) {
        const shrink = t > 0 ? sampledRadius(t) / t - 1 : CENTER_ZOOM - 1
        map.data[index] = Math.round(255 * (0.5 + (dx * shrink) / scale))
        map.data[index + 1] = Math.round(255 * (0.5 + (dy * shrink) / scale))
        map.data[index + 2] = 128
        map.data[index + 3] = 255
      }

      const towardLight = Math.max(0, Math.cos(angle - LIGHT_ANGLE))
      const shadowSide = (1 - Math.cos(angle - LIGHT_ANGLE)) / 2
      const edge = gauss(t, 0.985, 0.022) * (0.3 + 0.7 * shadowSide)
      const shine = towardLight ** 3 * (0.9 * gauss(t, 0.88, 0.07) + 0.55 * gauss(t, 1.05, 0.07))
      rim.data[index] = Math.round(255 * edge)
      rim.data[index + 1] = Math.round(255 * Math.min(1, shine))
      rim.data[index + 3] = 255
    }
  }

  return { map: toDataUrl(map), rim: toDataUrl(rim), scale, size }
}

function toDataUrl(imageData) {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d').putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
