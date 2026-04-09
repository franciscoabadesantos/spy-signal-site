'use client'
import StockTabs, { type StockTabKey } from '@/components/page/StockTabs'

export default function StockSubnav({
  ticker,
  active,
}: {
  ticker: string
  active?: StockTabKey
}) {
  return <StockTabs ticker={ticker} active={active ?? 'overview'} />
}
