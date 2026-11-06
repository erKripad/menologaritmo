import { apiNotFound, handleWork, handleWorks } from './routes/works.js'
import { handleImage } from './routes/image.js'

const IMAGE_ROUTE = /^\/api\/images\/([^/]+)$/
const WORK_ROUTE = /^\/api\/works\/([^/]+)$/

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return ''
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
    }

    if (url.pathname === '/api/works') return handleWorks(request, env, ctx)

    const workMatch = WORK_ROUTE.exec(url.pathname)
    if (workMatch) return handleWork(request, env, ctx, decodeSegment(workMatch[1]))

    const imageMatch = IMAGE_ROUTE.exec(url.pathname)
    if (imageMatch) return handleImage(request, env, ctx, decodeSegment(imageMatch[1]))

    return apiNotFound()
  },
}
