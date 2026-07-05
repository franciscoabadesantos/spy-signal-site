'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import ChartContainer from '@/components/charts/ChartContainer'
import NetworkGraphCanvas, { selectGlobalEdges } from '@/components/NetworkGraphCanvas'
import IconButton from '@/components/ui/IconButton'
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

type NetworkControlsState = {
  threshold: number
  setThreshold: (value: number) => void
  topK: number
  setTopK: (value: number) => void
  colorMode: ColorMode
  setRequestedColorMode: (mode: ColorMode) => void
  sectorFilter: GicsSectorKey | null
  setSectorFilter: React.Dispatch<React.SetStateAction<GicsSectorKey | null>>
  hasSectorData: boolean
  graph: NetworkGraph
  visibleEdgeCount: number
  backboneCount: number
  activeColorLegend: ReturnType<typeof buildCountryLegend> | ReturnType<typeof buildSectorLegend>
  sectorFilterOptions: ReturnType<typeof buildSectorLegend>
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-[var(--muted)] px-3 py-2">
      <div className="text-data-sm text-content-primary">{value}</div>
      <div className="text-micro text-content-muted">{label}</div>
    </div>
  )
}

function SliderControl({
  label,
  caption,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
  ariaLabel,
}: {
  label: string
  caption: string
  value: number
  displayValue: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  ariaLabel: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-filter-label">{label}</div>
        <span className="numeric-tabular rounded-[6px] bg-accent-tint px-2 py-0.5 text-label-sm text-accent-text">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[var(--primary)]"
        aria-label={ariaLabel}
      />
      <div className="mt-1 text-caption text-content-muted">{caption}</div>
    </div>
  )
}

function NetworkControls({
  threshold,
  setThreshold,
  topK,
  setTopK,
  colorMode,
  setRequestedColorMode,
  sectorFilter,
  setSectorFilter,
  hasSectorData,
  graph,
  visibleEdgeCount,
  backboneCount,
  activeColorLegend,
  sectorFilterOptions,
}: NetworkControlsState) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-filter-label">Colour by</div>
        <div className="mt-2 flex rounded-[var(--radius-md)] border border-border bg-[var(--muted)] p-1">
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
                  'flex-1 rounded-[8px] px-3 py-1.5 text-label-sm transition',
                  isActive
                    ? 'bg-surface-solid-raised text-content-primary shadow-[var(--shadow-xs)]'
                    : 'text-content-muted hover:text-content-secondary',
                  disabled ? 'cursor-not-allowed opacity-45' : undefined
                )}
                title={disabled ? 'Field colouring arrives once sector data is available.' : undefined}
                aria-pressed={isActive}
              >
                {mode === 'zone' ? 'Zone' : 'Field'}
              </button>
            )
          })}
        </div>
        <div className="mt-1 text-caption text-content-muted">
          {colorMode === 'zone' ? 'Colour is geography — position is behaviour.' : 'Colour is sector — position is behaviour.'}
        </div>
      </div>

      <SliderControl
        label="Link strength"
        caption="Higher keeps only the strongest links."
        value={threshold}
        displayValue={formatPercent(threshold)}
        min={0.2}
        max={0.95}
        step={0.05}
        onChange={setThreshold}
        ariaLabel="Minimum absolute correlation"
      />

      <SliderControl
        label="Links per company"
        caption="How many links each company keeps."
        value={topK}
        displayValue={String(topK)}
        min={2}
        max={10}
        step={1}
        onChange={setTopK}
        ariaLabel="Maximum non-backbone edges per node"
      />

      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Companies" value={graph.nodes.length} />
        <StatCell label="Visible links" value={visibleEdgeCount} />
        <StatCell label="Backbone links" value={backboneCount} />
        <StatCell label="Trading days" value={graph.window} />
      </div>

      <div>
        <div className="text-filter-label">{colorMode === 'field' && hasSectorData ? 'Sectors' : 'Zones'}</div>
        <div className="relative mt-2 max-h-48 space-y-2 overflow-auto pr-1 [mask-image:linear-gradient(to_bottom,black_86%,transparent)]">
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
                  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1.5 text-caption transition',
                  sectorFilter === item.key
                    ? 'border-primary/60 bg-accent-tint text-content-primary'
                    : 'border-border bg-surface-solid text-content-secondary hover:border-divider-strong'
                )}
                aria-pressed={sectorFilter === item.key}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-[var(--radius-md)] border border-dashed border-border px-3 py-2 text-caption text-content-muted">
            Arrives once sector data is populated.
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3 text-caption text-content-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block h-px w-8 bg-rel-residual" />
          Move together
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block h-px w-8 bg-rel-inverse" />
          Move opposite ways
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block h-px w-8 border-t-2 border-dashed border-content-muted" />
          Weaker link (backbone links always stay)
        </div>
      </div>
    </div>
  )
}

export default function MarketCorrelationNetwork({ graph }: { graph: NetworkGraph }) {
  const [threshold, setThreshold] = useState(0.5)
  const [topK, setTopK] = useState(5)
  const [colorMode, setColorMode] = useState<ColorMode>('zone')
  const [sectorFilter, setSectorFilter] = useState<GicsSectorKey | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
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

  const controlsState: NetworkControlsState = {
    threshold,
    setThreshold,
    topK,
    setTopK,
    colorMode,
    setRequestedColorMode,
    sectorFilter,
    setSectorFilter,
    hasSectorData,
    graph,
    visibleEdgeCount: visibleEdges.length,
    backboneCount: visibleEdges.filter((edge) => edge.inMst).length,
    activeColorLegend,
    sectorFilterOptions,
  }

  return (
    <div className="section-gap">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="material-surface min-h-[520px] overflow-hidden rounded-[var(--radius-xl)] p-2 lg:min-h-[620px]">
          <ChartContainer className="h-[520px] lg:h-[620px]" loadingText="Loading market network...">
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

        <aside className="material-surface hidden rounded-[var(--radius-xl)] p-4 lg:block">
          <NetworkControls {...controlsState} />
        </aside>
      </div>

      {/* Mobile: controls live in a glass bottom sheet (floating chrome). */}
      <div className="fixed bottom-5 right-5 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="material-glass state-interactive inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-label-md text-content-primary"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Controls
        </button>
      </div>
      {isSheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Network controls">
          <button
            type="button"
            aria-label="Close controls"
            className="absolute inset-0 bg-[rgba(3,6,12,0.55)]"
            onClick={() => setSheetOpen(false)}
          />
          <div className="material-glass absolute inset-x-0 bottom-0 max-h-[72vh] overflow-auto rounded-t-[24px] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-heading-sm text-content-primary">Controls</div>
              <IconButton aria-label="Close controls" variant="ghost" size="sm" onClick={() => setSheetOpen(false)}>
                <X className="size-4" />
              </IconButton>
            </div>
            <NetworkControls {...controlsState} />
          </div>
        </div>
      ) : null}

      <div className="text-caption text-content-muted">
        {graph.asOf ? `As of ${graph.asOf}` : 'Sample data'} · {graph.window} trading days · backbone links always stay
        visible.
      </div>
    </div>
  )
}
