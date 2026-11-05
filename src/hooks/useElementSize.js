import { useEffect, useState } from 'react'

// Larghezza e altezza (in pixel) di un elemento, aggiornate quando cambia dimensione.
export default function useElementSize(ref) {
  const [size, setSize] = useState(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect()
      setSize((current) =>
        current?.width === Math.round(width) && current?.height === Math.round(height)
          ? current
          : { width: Math.round(width), height: Math.round(height) },
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
