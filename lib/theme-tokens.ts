'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Canvas renderers (react-force-graph) take plain color strings, so CSS
 * variables must be resolved at runtime. Values re-resolve whenever the theme
 * class/attribute on <html> changes. Fallbacks are the dark-theme values so
 * SSR/first paint matches the default theme.
 */

export type GraphPalette = {
  relResidual: string
  relTheme: string
  relInverse: string
  relLeadLag: string
  relLeadLagIn: string
  relMarket: string
  relSpurious: string
  canvasBg: string
  nodeLabel: string
  labelHalo: string
  nodeLabelInverse: string
  nodeStroke: string
}

const GRAPH_PALETTE_TOKENS: Record<keyof GraphPalette, string> = {
  relResidual: '--rel-residual',
  relTheme: '--rel-theme',
  relInverse: '--rel-inverse',
  relLeadLag: '--rel-leadlag',
  relLeadLagIn: '--rel-leadlag-in',
  relMarket: '--rel-market',
  relSpurious: '--rel-spurious',
  canvasBg: '--graph-canvas-bg',
  nodeLabel: '--graph-node-label',
  labelHalo: '--graph-label-halo',
  nodeLabelInverse: '--graph-node-label-inverse',
  nodeStroke: '--graph-node-stroke',
}

export const DARK_GRAPH_PALETTE: GraphPalette = {
  relResidual: '#36b3ff',
  relTheme: '#a7f3d0',
  relInverse: '#ff867b',
  relLeadLag: '#ffcb47',
  relLeadLagIn: '#f59e0b',
  relMarket: '#73cbff',
  relSpurious: '#94a3b8',
  canvasBg: '#07111f',
  nodeLabel: '#f7fbff',
  labelHalo: '#07111f',
  nodeLabelInverse: '#07111f',
  nodeStroke: 'rgba(255, 255, 255, 0.62)',
}

function readGraphPalette(): GraphPalette {
  if (typeof window === 'undefined') return DARK_GRAPH_PALETTE
  const styles = getComputedStyle(document.documentElement)
  const palette = { ...DARK_GRAPH_PALETTE }
  for (const key of Object.keys(GRAPH_PALETTE_TOKENS) as Array<keyof GraphPalette>) {
    const value = styles.getPropertyValue(GRAPH_PALETTE_TOKENS[key]).trim()
    if (value) palette[key] = value
  }
  return palette
}

export function useGraphPalette(): GraphPalette {
  const [palette, setPalette] = useState<GraphPalette>(DARK_GRAPH_PALETTE)

  useEffect(() => {
    const update = () => setPalette(readGraphPalette())
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  return useMemo(() => palette, [palette])
}
