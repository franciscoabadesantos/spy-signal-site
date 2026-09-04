import { currencyDisplayName } from '@/lib/currency'
import { exchangeDisplayName } from '@/lib/exchange-names'

export type AssetOrientationKind = 'ETF' | 'Equity'

export function assetOrientation(
  assetKind: AssetOrientationKind,
  exchangeCode: string | null,
  currencyCode: string
): string {
  const subject = assetKind === 'ETF' ? 'An exchange-traded fund' : 'A publicly traded company'
  const exchange = exchangeDisplayName(exchangeCode)
  const listing = exchange ? `, listed on ${exchange}` : ''

  return `${subject}${listing}, priced in ${currencyDisplayName(currencyCode)}.`
}
