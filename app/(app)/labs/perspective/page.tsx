import type { Metadata } from 'next'
import PerspectiveDialDemo from '@/components/stocks/PerspectiveDialDemo'
import { parseInvestmentLens } from '@/lib/investment-lens'

export const metadata: Metadata = {
  title: 'Perspective Dial · Longbrunch Labs',
  robots: { index: false, follow: false },
}

export default async function PerspectiveDialPage({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string | string[] }>
}) {
  const params = await searchParams
  const rawLens = Array.isArray(params.lens) ? params.lens[0] : params.lens
  const lens = rawLens ? parseInvestmentLens(rawLens) : 'medium'

  return <PerspectiveDialDemo initialValue={lens} />
}
