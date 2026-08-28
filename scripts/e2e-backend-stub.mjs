/**
 * Deterministic fixture backend for browser QA.
 *
 * The Market Universe page fetches its atlas server-side, so a Playwright
 * page.route() mock cannot reach it. This serves the three relationship
 * endpoints that page needs from repository-owned synthetic data, so the
 * browser suite never depends on production, staging or self-hosted
 * infrastructure and needs no credentials.
 *
 * Every other path answers 503, which is what the app already sees when no
 * backend is reachable. That keeps the unrelated specs on the behaviour they
 * were written against.
 */
import { createServer } from 'node:http'
import {
  atlasFixture,
  communityFixture,
  neighborhoodFixture,
  tickerIndexFixture,
} from '../e2e/fixtures/market-atlas.mjs'

const HOST = '127.0.0.1'
const PORT = Number(process.env.E2E_BACKEND_STUB_PORT || 3101)

const ATLAS_VIEWS = new Set(['market', 'residual', 'timing', 'theme'])

function readView(params) {
  const view = params.get('view')
  return view && ATLAS_VIEWS.has(view) ? view : 'market'
}

function readWindow(params) {
  return params.get('window') === '126' ? 126 : 252
}

function send(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${HOST}:${PORT}`)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const window = readWindow(url.searchParams)
  const view = readView(url.searchParams)

  if (path === '/health') {
    send(response, 200, { status: 'ok', fixture: true })
    return
  }

  // Every page renders the header search, which loads this once. Serving it
  // keeps the browser console clean without weakening any assertion.
  if (path === '/tickers/index') {
    send(response, 200, tickerIndexFixture())
    return
  }

  if (path === '/network/atlas') {
    send(response, 200, atlasFixture(window, view))
    return
  }

  const community = path.match(/^\/network\/communities\/([^/]+)$/)
  if (community) {
    const payload = communityFixture(decodeURIComponent(community[1]), window, view)
    if (!payload) {
      send(response, 404, { error: 'fixture_community_not_found' })
      return
    }
    send(response, 200, payload)
    return
  }

  const neighborhood = path.match(/^\/network\/neighborhoods\/([^/]+)$/)
  if (neighborhood) {
    const payload = neighborhoodFixture(decodeURIComponent(neighborhood[1]), window, view)
    if (!payload) {
      send(response, 404, { error: 'fixture_neighborhood_not_found' })
      return
    }
    send(response, 200, payload)
    return
  }

  // Anything this fixture does not model stays unavailable on purpose.
  send(response, 503, { error: 'fixture_backend_unavailable', path })
})

server.listen(PORT, HOST, () => {
  console.log(`[e2e-backend-stub] fixture backend listening on http://${HOST}:${PORT}`)
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
