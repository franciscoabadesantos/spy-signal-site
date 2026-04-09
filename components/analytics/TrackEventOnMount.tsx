'use client'

import { useEffect, useRef } from 'react'
import { trackEvent, type AnalyticsEventName, type AnalyticsPayload } from '@/lib/analytics'

export default function TrackEventOnMount({
  eventName,
  payload = {},
}: {
  eventName: AnalyticsEventName
  payload?: AnalyticsPayload
}) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    trackEvent(eventName, payload)
  }, [eventName, payload])

  return null
}

