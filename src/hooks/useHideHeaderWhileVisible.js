import { useLayoutEffect } from 'react'
import { useOutletContext } from 'react-router'

// Nasconde l'header finché l'elemento si vede sotto la barra; quando esce in alto la barra
// compare, tornando su sparisce di nuovo. Usato nell'apertura della home: la scritta
// menologaritmo fa già da logo.
export default function useHideHeaderWhileVisible(ref) {
  const { setHeaderHidden } = useOutletContext()

  useLayoutEffect(() => {
    const element = ref.current
    // Nascosto già prima che la pagina si disegni, così l'header non compare per poi sparire.
    // Se la pagina si apre più in basso (es. tornando dalla galleria) l'osservatore lo rimette.
    setHeaderHidden(true)

    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0

    const observer = new IntersectionObserver(([entry]) => setHeaderHidden(entry.isIntersecting), {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
      setHeaderHidden(false)
    }
  }, [ref, setHeaderHidden])
}
