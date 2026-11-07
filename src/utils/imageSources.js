// Le foto di Drive arrivano dal worker in più larghezze (vedi worker/routes/image.js):
// il browser sceglie la più adatta allo schermo, così il cellulare non scarica gli originali.
const IMAGE_WIDTHS = [640, 1280, 1920]
const DEFAULT_WIDTH = 1280

function withWidth(url, width) {
  return `${url}${url.includes('?') ? '&' : '?'}w=${width}`
}

export default function imageSources(url, sizes) {
  return {
    src: withWidth(url, DEFAULT_WIDTH),
    srcSet: IMAGE_WIDTHS.map((width) => `${withWidth(url, width)} ${width}w`).join(', '),
    sizes,
  }
}
