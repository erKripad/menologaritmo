import net from 'node:net'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_PORT = 8788

// Controlla se l'API locale (npm run dev:api) è in ascolto.
function isApiRunning() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: API_PORT, host: 'localhost' })
    const done = (running) => {
      socket.destroy()
      resolve(running)
    }
    socket.setTimeout(300)
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    socket.once('timeout', () => done(false))
  })
}

// Con solo "npm run dev" l'API non c'è: invece di far fallire il proxy (errori rossi nel
// terminale e nella console del browser) risponde vuoto, e il sito usa le foto segnaposto.
function apiFallback() {
  let warned = false

  return {
    name: 'api-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/') || (await isApiRunning())) return next()

        if (!warned) {
          warned = true
          server.config.logger.info(
            `  API locale non attiva: uso le foto segnaposto. Per le foto vere da Drive usa "npm run dev:api".`,
          )
        }

        const isWorks = req.url.split('?')[0] === '/api/works'
        res.statusCode = isWorks ? 200 : 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(isWorks ? { works: [] } : { error: 'API locale non attiva' }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiFallback()],
  server: {
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
    },
  },
})
