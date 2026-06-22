import ScorecardDisc from '@/components/stocks/ScorecardDisc'
import type { Scorecard } from '@/lib/scorecard-types'
import { cn } from '@/lib/utils'

type OrbitMiniProps = {
  scorecard: Scorecard
  size?: number
  className?: string
}

export default function OrbitMini({
  scorecard,
  size = 40,
  className,
}: OrbitMiniProps) {
  return (
    <ScorecardDisc
      scorecard={scorecard}
      mini
      size={size}
      className={cn('shrink-0', className)}
    />
  )
}
