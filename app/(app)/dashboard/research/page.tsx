import Link from 'next/link'
import Card from '@/components/ui/Card'
import { buttonClass } from '@/components/ui/Button'

export default function DashboardResearchIndexPage() {
  return (
    <Card>
      <h1 className="text-section-title text-content-primary">Research</h1>
      <p className="text-body mt-2">Review saved AI research runs from your dashboard workflows.</p>
      <div className="mt-4">
        <Link href="/dashboard" className={buttonClass({ variant: 'secondary' })}>
          Open Dashboard Overview
        </Link>
      </div>
    </Card>
  )
}
