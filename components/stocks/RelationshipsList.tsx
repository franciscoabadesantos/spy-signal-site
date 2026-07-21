import RelationshipOrbit from '@/components/RelationshipOrbit'
import type { TickerRelationships } from '@/lib/relationships'

export default function RelationshipsList({ relationshipsByWindow, centerTicker, centerName }: { relationshipsByWindow: Record<126 | 252, TickerRelationships>; centerTicker: string; centerName: string | null }) {
  return <RelationshipOrbit relationshipsByWindow={relationshipsByWindow} centerTicker={centerTicker} centerName={centerName} />
}
