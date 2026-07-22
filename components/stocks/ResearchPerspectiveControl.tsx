'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import PerspectiveDial from '@/components/stocks/PerspectiveDial'
import type { InvestmentLensKey } from '@/lib/investment-lens'

export default function ResearchPerspectiveControl({ lens }: { lens: InvestmentLensKey }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <PerspectiveDial
      initialValue={lens}
      onCommit={(nextLens) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('lens', nextLens)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }}
    />
  )
}
