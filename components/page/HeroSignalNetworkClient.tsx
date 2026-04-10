'use client'

import nextDynamic from 'next/dynamic'
import type { ScreenerSignal } from '@/lib/signals'

type HeroSignalNetworkClientProps = {
  signals: ScreenerSignal[]
}

const HeroSignalNetwork = nextDynamic(() => import('@/components/page/HeroSignalNetwork'), {
  ssr: false,
  loading: () => (
    <div className="text-body-sm flex min-h-[340px] items-center justify-center px-5 py-6 text-content-muted">
      Loading signal network...
    </div>
  ),
})

export default function HeroSignalNetworkClient({ signals }: HeroSignalNetworkClientProps) {
  return <HeroSignalNetwork signals={signals} />
}
