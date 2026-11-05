import { LENS_SCALE } from './useGlassRefraction.js'

// Misure in pixel: con le percentuali Chrome sbaglia la mappa sugli schermi retina
// e il contenuto sotto la barra risulta spostato.
export default function GlassFilter({ id, href, width, height }) {
  return (
    <svg className="header__filter" aria-hidden="true" focusable="false">
      <filter
        id={id}
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={width}
        height={height}
        colorInterpolationFilters="sRGB"
      >
        <feImage href={href} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="lens" />
        <feDisplacementMap in="SourceGraphic" in2="lens" scale={LENS_SCALE} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
