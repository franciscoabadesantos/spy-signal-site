import InvestmentLens from '@/components/stocks/InvestmentLens'

export default async function LensPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  return <InvestmentLens ticker={ticker.toUpperCase()} />
}
