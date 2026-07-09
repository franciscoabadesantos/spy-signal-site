import { proxyTickerIndex } from '../../../../lib/ticker-index-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return proxyTickerIndex(request)
}
