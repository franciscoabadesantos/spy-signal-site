'use client'

import { useMemo, useState } from 'react'
import ChartContainer from '@/components/charts/ChartContainer'
import NetworkGraphCanvas, { selectGlobalEdges } from '@/components/NetworkGraphCanvas'
import type { NetworkGraph } from '@/lib/network'
import {
  buildCountryLegend,
  buildSectorLegend,
  type ColorMode,
  type GicsSectorKey,
} from '@/lib/network-regions'
import { cn } from '@/lib/utils'

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export default function MarketCorrelationNetwork({ graph }: { graph: NetworkGraph }) {
  const [threshold, setThreshold] = useState(0.5)
  const [topK, setTopK] = useState(5)
  const [colorMode, setColorMode] = useState<ColorMode>('zone')
  const [sectorFilter, setSectorFilter] = useState<GicsSectorKey | null>(null)
  const visibleEdges = useMemo(() => selectGlobalEdges(graph.edges, threshold, topK), [graph.edges, threshold, topK])
  const countryLegend = useMemo(() => buildCountryLegend(graph.nodes), [graph.nodes])
  const sectorLegend = useMemo(() => buildSectorLegend(graph.nodes), [graph.nodes])
  const sectorFilterOptions = sectorLegend.filter((item) => item.key !== 'unknown')
  const hasSectorData = sectorFilterOptions.length > 0
  const activeColorLegend = colorMode === 'field' && hasSectorData ? sectorLegend : countryLegend

  function setRequestedColorMode(mode: ColorMode) {
    if (mode === 'field' && !hasSectorData) return
    setColorMode(mode)
  }

  return (
    <div className="section-gap">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-h-[620px] overflow-hidden rounded-[8px] border border-border bg-surface p-2">
          <ChartContainer className="h-[620px]" loadingText="Loading market network...">
            {({ width, height }) => (
              <NetworkGraphCanvas
                graph={graph}
                threshold={threshold}
                topK={topK}
                colorMode={colorMode}
                sectorFilter={sectorFilter}
                mode="global"
                width={width}
                height={height}
              />
            )}
          </ChartContainer>
        </div>

        <aside className="space-y-4 rounded-[8px] border border-border bg-surface-elevated p-4">
          <div>
            <div className="text-filter-label">Colour</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['zone', 'field'] as ColorMode[]).map((mode) => {
                const disabled = mode === 'field' && !hasSectorData
                const isActive = colorMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    onClick={() => setRequestedColorMode(mode)}
                    className={cn(
                      'rounded-[8px] border px-3 py-2 text-label-sm transition',
                      isActive
                        ? 'border-primary/50 bg-primary/10 text-content-primary'
                        : 'border-border bg-surface text-content-secondary hover:bg-surface-hover',
                      disabled ? 'cursor-not-allowed opacity-45 hover:bg-surface' : undefined
                    )}
                    title={disabled ? 'Field colouring is coming soon once sector data is available.' : undefined}
                  >
                    {mode === 'zone' ? 'Zone' : 'Field'}
                  </button>
                )
              })}
            </div>
            {!hasSectorData ? (
              <div className="mt-2 text-caption text-content-muted">Field mode coming soon with sector data.</div>
            ) : null}
          </div>

          <div>
            <div className="text-filter-label">Edge threshold</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="Minimum absolute correlation"
              />
              <span className="numeric-tabular text-label-sm text-content-primary">{formatPercent(threshold)}</span>
            </div>
          </div>

          <div>
            <div className="text-filter-label">Top-K density</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="w-full accent-[var(--color-accent)]"
                aria-label="Maximum non-backbone edges per node"
              />
              <span className="numeric-tabular text-label-sm text-content-primary">{topK}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-caption text-content-muted">
            <div>
              <div className="text-label-sm text-content-primary">{graph.nodes.length}</div>
              Nodes
            </div>
            <div>
              <div className="text-label-sm text-content-primary">{visibleEdges.length}</div>
              Visible edges
            </div>
            <div>
              <div className="text-label-sm text-content-primary">{visibleEdges.filter((edge) => edge.inMst).length}</div>
              Backbone
            </div>
            <div>
              <div className="text-label-sm text-content-primary">{graph.window}</div>
              Window
            </div>
          </div>

          <div>
            <div className="text-filter-label">{colorMode === 'field' && hasSectorData ? 'Field legend' : 'Zone legend'}</div>
            <div className="mt-2 max-h-48 space-y-2 overflow-auto pr-1">
              {activeColorLegend.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-caption text-content-secondary">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>
                      {item.label}
                      {'familyLabel' in item && item.familyLabel !== item.label ? (
                        <span className="text-content-muted"> · {item.familyLabel}</span>
                      ) : null}
                    </span>
                  </span>
                  {'count' in item ? <span className="numeric-tabular">{item.count}</span> : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-filter-label">Sector spotlight</div>
              {sectorFilter ? (
                <button
                  type="button"
                  className="text-caption text-content-muted underline-offset-2 hover:text-content-primary hover:underline"
                  onClick={() => setSectorFilter(null)}
                >
                  Clear
                </button>
              ) : null}
            </div>
            {hasSectorData ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {sectorFilterOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSectorFilter((current) => (current === item.key ? null : item.key))}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-caption transition',
                      sectorFilter === item.key
                        ? 'border-primary/60 bg-primary/10 text-content-primary'
                        : 'border-border bg-surface text-content-secondary hover:bg-surface-hover'
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-[8px] border border-dashed border-border px-3 py-2 text-caption text-content-muted">
                Coming soon once sector data is populated.
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3 text-caption text-content-muted">
            <div className="flex items-center gap-2">
              <span className="inline-block h-px w-8 bg-[#36B3FF]" />
              Positive correlation
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-px w-8 bg-[#FF867B]" />
              Negative correlation
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-px w-8 border-t-2 border-dashed border-content-muted" />
              Non-backbone edge
            </div>
          </div>
        </aside>
      </div>

      <div className={cn('text-caption text-content-muted', graph.asOf ? undefined : 'text-content-secondary')}>
        {graph.asOf ? `As of ${graph.asOf}` : 'Fixture data'} · window {graph.window} · backbone edges always stay visible.
      </div>
    </div>
  )
}
