import { useSyncExternalStore } from 'react'

// true finché la media query è soddisfatta, si aggiorna quando cambia (es. rotazione del telefono).
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
