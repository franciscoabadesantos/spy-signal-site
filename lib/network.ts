import 'server-only'

import { BackendDataError, fetchBackendJson } from './backend'
import { MOCK_MARKET_NETWORK, sliceMockNetwork } from './network-fixture'

export type NetworkNode = {
  ticker: string
  name: string | null
  country: string | null
  region: string | null
  sector: string | null
  marketCap: number | null
  degree: number | null
}

export type NetworkEdge = {
  source: string
  target: string
  correlation: number
  absCorrelation: number
  inMst: boolean
}

export type NetworkGraph = {
  asOf: string | null
  window: string
  focus: string | null
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

export type MarketNetworkOptions = {
  window?: string
  minAbsCorrelation?: number
  topK?: number
}

export type TickerNetworkOptions = {
  hops?: number
  topK?: number
  minAbsCorrelation?: number
}

const NETWORK_REVALIDATE_SECONDS = 900

function appendNetworkParams(path: string, params: Record<string, string | number | null | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

function cachedNetworkInit(): RequestInit & { next: { revalidate: number; tags: string[] } } {
  return {
    cache: 'force-cache',
    next: {
      revalidate: NETWORK_REVALIDATE_SECONDS,
      tags: ['market-network'],
    },
  }
}

function normalizeNetworkGraph(graph: NetworkGraph, focus: string | null): NetworkGraph {
  return {
    asOf: graph.asOf ?? null,
    window: graph.window || '1y',
    focus: graph.focus ?? focus,
    nodes: graph.nodes.map((node) => ({
      ticker: node.ticker.trim().toUpperCase(),
      name: node.name ?? null,
      country: node.country ?? null,
      region: node.region ?? null,
      sector: node.sector ?? null,
      marketCap: typeof node.marketCap === 'number' && Number.isFinite(node.marketCap) ? node.marketCap : null,
      degree: typeof node.degree === 'number' && Number.isFinite(node.degree) ? node.degree : null,
    })),
    edges: graph.edges
      .map((edge) => ({
        source: edge.source.trim().toUpperCase(),
        target: edge.target.trim().toUpperCase(),
        correlation: Number(edge.correlation),
        absCorrelation: Number(edge.absCorrelation),
        inMst: Boolean(edge.inMst),
      }))
      .filter(
        (edge) =>
          edge.source &&
          edge.target &&
          edge.source !== edge.target &&
          Number.isFinite(edge.correlation) &&
          Number.isFinite(edge.absCorrelation)
      ),
  }
}

function shouldUseFixture(error: unknown): boolean {
  if (!(error instanceof BackendDataError)) return false
  return error.status === null || error.status === 404 || error.status === 501 || error.status === 503
}

export async function getMarketNetwork(options: MarketNetworkOptions = {}): Promise<NetworkGraph> {
  const path = appendNetworkParams('/network', {
    window: options.window,
    minAbsCorrelation: options.minAbsCorrelation,
    topK: options.topK,
  })

  try {
    const graph = await fetchBackendJson<NetworkGraph>(path, {
      context: 'market.network',
      timeoutMs: 9000,
      init: cachedNetworkInit(),
    })
    return normalizeNetworkGraph(graph, null)
  } catch (error) {
    if (!shouldUseFixture(error)) throw error
    return normalizeNetworkGraph(MOCK_MARKET_NETWORK, null)
  }
}

export async function getTickerNetwork(
  tickerRaw: string,
  options: TickerNetworkOptions = {}
): Promise<NetworkGraph> {
  const ticker = tickerRaw.trim().toUpperCase()
  const hops = Math.max(1, Math.min(2, Math.round(options.hops ?? 1)))
  // Peer web defaults: surface more peers (incl. moderate/negative ones) than the
  // global-map defaults, since a single ticker (esp. defensives) has few very-strong links.
  const topK = Math.max(1, Math.min(50, Math.round(options.topK ?? 10)))
  const minAbsCorrelation = options.minAbsCorrelation ?? 0.2
  const path = appendNetworkParams('/network', {
    focus: ticker,
    hops,
    topK,
    minAbsCorrelation,
  })

  try {
    const graph = await fetchBackendJson<NetworkGraph>(path, {
      context: `ticker.network.${ticker}`,
      timeoutMs: 9000,
      init: cachedNetworkInit(),
    })
    return normalizeNetworkGraph(graph, ticker)
  } catch (error) {
    if (!shouldUseFixture(error)) throw error
    return normalizeNetworkGraph(sliceMockNetwork(ticker, hops), ticker)
  }
}
