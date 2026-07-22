import RelationshipOrbit from '@/components/RelationshipOrbit'
import type { RelationshipWindow, ToggleLayer } from '@/components/RelationshipOrbit'
import type { TickerRelationships } from '@/lib/relationships'

export default function RelationshipsList({
  relationshipsByWindow,
  centerTicker,
  centerName,
  initialWindow,
  initialLayer,
}: {
  relationshipsByWindow: Record<RelationshipWindow, TickerRelationships>
  centerTicker: string
  centerName: string | null
  initialWindow?: RelationshipWindow
  initialLayer?: ToggleLayer
}) {
  return (
    <RelationshipOrbit
      relationshipsByWindow={relationshipsByWindow}
      centerTicker={centerTicker}
      centerName={centerName}
      initialWindow={initialWindow}
      initialLayer={initialLayer}
    />
  )
}
