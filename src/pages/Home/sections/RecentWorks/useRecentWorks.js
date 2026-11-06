import { useEffect, useState } from 'react'
import placeholderWorks from '../../../../data/placeholderWorks.js'

// ?v=2: formato con le cartelle evento. Cambiando versione, browser e Cloudflare non usano
// le risposte salvate in cache col formato vecchio.
const API_URL = '/api/works?v=2'
const LOADING_SLIDES = 3

const loadingWorks = Array.from({ length: LOADING_SLIDES }, (_, index) => ({ slug: `loading-${index}`, image: null }))

// status: "loading" | "ready" | "empty"
export default function useRecentWorks() {
  const [state, setState] = useState({ status: 'loading', works: loadingWorks })

  useEffect(() => {
    const controller = new AbortController()

    const fallback = () =>
      import.meta.env.DEV
        ? { status: 'ready', works: placeholderWorks }
        : { status: 'empty', works: [] }

    fetch(API_URL, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
          throw new Error(`Recent works request failed: ${response.status}`)
        }
        return response.json()
      })
      .then(({ works }) => setState(works?.length ? { status: 'ready', works } : fallback()))
      .catch((error) => {
        if (error.name === 'AbortError') return
        console.error(error)
        setState(fallback())
      })

    return () => controller.abort()
  }, [])

  return state
}
