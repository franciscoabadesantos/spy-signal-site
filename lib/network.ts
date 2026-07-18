import 'server-only'

import { BackendDataError, fetchBackendJson } from './backend'
import { MOCK_MARKET_NETWORK, sliceMockNetwork } from './network-fixture'

export type NetworkNode = {
  ticker: string
  symbol?: string
  name: string | null
  country: string | null
  region: string | null
  sector: string | null
  marketCap: number | null
  degree: number | null
  entityId?: string
  lei?: string | null
  legalName?: string | null
  homeCountry?: string | null
  siblingSymbols?: string[]
}

export type NetworkEdge = {
  id?: string
  source: string
  target: string
  correlation: number
  absCorrelation: number
  inMst: boolean
  relationshipLayer?: string
  relationshipLabel?: string
  relationshipDescription?: string
  relationshipInlineLabel?: string
  relationshipThemes?: string[]
  relationshipColor?: string
  relationshipAlpha?: number
  relationshipDash?: number[] | null
  relationshipDirectional?: boolean
  relationshipCurvature?: number
  relationshipWidthBoost?: number
  relationshipConfidence?: number | null
  relationshipSourceLayer?: string
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

type BackendNetworkNode = Partial<NetworkNode> & {
  entity_id?: string
  legal_name?: string
  home_country?: string
  sibling_symbols?: string[]
}

type BackendNetworkEdge = Partial<NetworkEdge> & {
  layer?: string
  strength?: number
  confidence?: number | null
  direction?: string
}

type BackendNetworkGraph = Omit<Partial<NetworkGraph>, 'nodes' | 'edges'> & {
  nodes?: BackendNetworkNode[]
  edges?: BackendNetworkEdge[]
}

const LAYER_PRESENTATION: Record<string, Pick<NetworkEdge, 'relationshipLabel' | 'relationshipDescription' | 'relationshipColor' | 'relationshipDash' | 'relationshipDirectional'>> = {
  raw_price: { relationshipLabel: 'Raw price', relationshipDescription: 'Daily-return co-movement.', relationshipColor: '#36B3FF', relationshipDash: null, relationshipDirectional: false },
  residual_price: { relationshipLabel: 'Residual price', relationshipDescription: 'Idiosyncratic relationship after market and FX factors.', relationshipColor: '#1FC8A7', relationshipDash: null, relationshipDirectional: false },
  lead_lag: { relationshipLabel: 'Lead / lag', relationshipDescription: 'Directional lead/lag relationship.', relationshipColor: '#F2B84B', relationshipDash: null, relationshipDirectional: true },
  theme_etf: { relationshipLabel: 'Theme ETF', relationshipDescription: 'ETF or theme co-membership.', relationshipColor: '#A78BFA', relationshipDash: [4, 3], relationshipDirectional: false },
  probable_spurious: { relationshipLabel: 'Probable spurious', relationshipDescription: 'Strong raw relationship with weak residual support.', relationshipColor: '#FF867B', relationshipDash: [5, 3], relationshipDirectional: false },
}

function normalizedSymbol(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
}

export function normalizeNetworkGraph(graph: BackendNetworkGraph, focus: string | null): NetworkGraph {
  return {
    asOf: graph.asOf ?? null,
    window: graph.window || '1y',
    focus: graph.focus ?? focus,
    nodes: (graph.nodes ?? [])
      .map((node): NetworkNode | null => {
        const symbol = normalizedSymbol(node.symbol ?? node.ticker)
        const entityId = normalizedSymbol(node.entityId ?? node.entity_id)
        const ticker = entityId || symbol
        if (!ticker) return null
        return {
          ticker,
          symbol: symbol || undefined,
          name: node.legalName ?? node.legal_name ?? node.name ?? null,
          country: node.country ?? node.homeCountry ?? node.home_country ?? null,
          region: node.region ?? null,
          sector: node.sector ?? null,
          marketCap: typeof node.marketCap === 'number' && Number.isFinite(node.marketCap) ? node.marketCap : null,
          degree: typeof node.degree === 'number' && Number.isFinite(node.degree) ? node.degree : null,
          entityId: entityId || undefined,
          lei: node.lei ?? null,
          legalName: node.legalName ?? node.legal_name ?? null,
          homeCountry: node.homeCountry ?? node.home_country ?? null,
          siblingSymbols: Array.isArray(node.siblingSymbols ?? node.sibling_symbols)
            ? (node.siblingSymbols ?? node.sibling_symbols)?.map(normalizedSymbol).filter(Boolean)
            : undefined,
        }
      })
      .filter((node): node is NetworkNode => node !== null),
    edges: (graph.edges ?? [])
      .map((edge) => {
        const layer = String(edge.layer ?? edge.relationshipSourceLayer ?? 'raw_price')
        const strength = Number(edge.strength ?? edge.absCorrelation ?? edge.correlation)
        const confidence = edge.confidence ?? edge.relationshipConfidence ?? null
        return {
          source: normalizedSymbol(edge.source),
          target: normalizedSymbol(edge.target),
          correlation: strength,
          absCorrelation: strength,
          inMst: Boolean(edge.inMst),
          relationshipSourceLayer: layer,
          relationshipConfidence: typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : null,
          relationshipAlpha: typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : undefined,
          ...LAYER_PRESENTATION[layer],
        }
      })
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
    const graph = await fetchBackendJson<BackendNetworkGraph>(path, {
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
    const graph = await fetchBackendJson<BackendNetworkGraph>(path, {
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
