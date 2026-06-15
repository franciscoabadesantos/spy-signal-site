import type { Metadata } from 'next'
import MethodologyPage from '@/components/marketing/MethodologyPage'

export const metadata: Metadata = {
  title: 'Method | Longbrunch',
  description: 'Read the Longbrunch method and how the weekly read is built.',
}

export default function Method() {
  return <MethodologyPage />
}
