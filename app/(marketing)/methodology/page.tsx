import type { Metadata } from 'next'
import MethodologyPage from '@/components/marketing/MethodologyPage'

export const metadata: Metadata = {
  title: 'Methodology | Northline Signal',
  description: 'How Northline Signal turns market data into a systematic S&P 500 exposure signal.',
}

export default function Methodology() {
  return <MethodologyPage />
}
