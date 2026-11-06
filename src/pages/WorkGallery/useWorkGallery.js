import { useEffect, useState } from 'react'
import { placeholderGallery } from '../../data/placeholderWorks.js'

class NotFoundError extends Error {}

// status: "loading" | "ready" | "not-found" | "error"
export default function useWorkGallery(slug) {
  const [state, setState] = useState({ slug: null })

  useEffect(() => {
    const controller = new AbortController()

    const fallback = (status) => {
      const placeholder = import.meta.env.DEV ? placeholderGallery(slug) : null
      return placeholder ? { slug, status: 'ready', ...placeholder } : { slug, status }
    }

    fetch(`/api/works/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (response.status === 404) throw new NotFoundError()
        if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
          throw new Error(`Gallery request failed: ${response.status}`)
        }
        return response.json()
      })
      .then(({ work, photos }) => setState({ slug, status: 'ready', work, photos }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error instanceof NotFoundError) {
          setState(fallback('not-found'))
          return
        }
        console.error(error)
        setState(fallback('error'))
      })

    return () => controller.abort()
  }, [slug])

  return state.slug === slug ? state : { slug, status: 'loading' }
}
