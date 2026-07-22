'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { parseInvestmentLens } from '@/lib/investment-lens'

export default function ResearchOverviewLink({ ticker }: { ticker: string }) {
  const searchParams = useSearchParams()
  const lens = parseInvestmentLens(searchParams.get('lens'))
  return <Link href={`/stocks/${ticker}?lens=${lens}`} className="action-link inline-flex">Back to overview →</Link>
}
