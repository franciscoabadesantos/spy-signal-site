'use client'

import { useEffect, useRef, useState } from 'react'
import { ResponsiveContainer, Sankey, type SankeyLinkProps, type SankeyNodeProps } from 'recharts'

export type PortfolioFlowNodeTone = 'sector' | 'portfolio' | 'holding' | 'other'

export type PortfolioFlowNodeDatum = {
  name: string
  value: number
  valueLabel: string
  tone: PortfolioFlowNodeTone
}

export type PortfolioFlowLinkDatum = {
  source: number
  target: number
  value: number
}

type PortfolioFlowSankeyProps = {
  title: string
  subtitle: string
  totalWeight: number
  topHoldingsWeight: number
  data: {
    nodes: PortfolioFlowNodeDatum[]
    links: PortfolioFlowLinkDatum[]
  }
}

function trimLabel(value: string, max = 18): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function getNodeFill(tone: PortfolioFlowNodeTone): string {
  switch (tone) {
    case 'sector':
      return '#6ea7ff'
    case 'portfolio':
      return '#7de4d3'
    case 'holding':
      return '#f2c66d'
    case 'other':
      return '#4c5f7c'
    default:
      return '#94a3b8'
  }
}

function getLinkFill(tone: PortfolioFlowNodeTone): string {
  switch (tone) {
    case 'sector':
      return 'rgba(110, 167, 255, 0.22)'
    case 'portfolio':
      return 'rgba(125, 228, 211, 0.22)'
    case 'holding':
      return 'rgba(242, 198, 109, 0.18)'
    case 'other':
      return 'rgba(76, 95, 124, 0.2)'
    default:
      return 'rgba(148, 163, 184, 0.18)'
  }
}

function FlowNode(props: SankeyNodeProps) {
  const payload = props.payload as SankeyNodeProps['payload'] & PortfolioFlowNodeDatum & { depth?: number }
  const fill = getNodeFill(payload.tone)
  const depth = payload.depth ?? 0
  const anchor = depth === 0 ? 'start' : depth === 1 ? 'middle' : 'end'
  const labelX = depth === 0 ? props.x : depth === 1 ? props.x + props.width / 2 : props.x + props.width
  const labelWidth = depth === 1 ? 180 : 150

  return (
    <g>
      <rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        rx={4}
        fill={fill}
        opacity={0.95}
      />
      <text
        x={labelX}
        y={Math.max(18, props.y - 10)}
        textAnchor={anchor}
        fontSize={depth === 1 ? 13 : 12}
        fontWeight={700}
        fill="#e5e7eb"
      >
        {trimLabel(payload.name, depth === 1 ? 20 : 18)}
      </text>
      <text
        x={labelX}
        y={Math.max(34, props.y + 8)}
        textAnchor={anchor}
        fontSize={11}
        fontWeight={600}
        fill="#93a4bd"
      >
        {trimLabel(payload.valueLabel, labelWidth)}
      </text>
    </g>
  )
}

function FlowLink(props: SankeyLinkProps) {
  const payload = props.payload as SankeyLinkProps['payload'] & {
    source: PortfolioFlowNodeDatum
  }
  const fill = getLinkFill(payload.source.tone)
  const curvature = 0.5
  const controlPointA = props.sourceX + (props.targetX - props.sourceX) * curvature
  const controlPointB = props.targetX - (props.targetX - props.sourceX) * curvature
  const halfWidth = props.linkWidth / 2

  const path = [
    `M ${props.sourceX} ${props.sourceY - halfWidth}`,
    `C ${controlPointA} ${props.sourceY - halfWidth}, ${controlPointB} ${props.targetY - halfWidth}, ${props.targetX} ${props.targetY - halfWidth}`,
    `L ${props.targetX} ${props.targetY + halfWidth}`,
    `C ${controlPointB} ${props.targetY + halfWidth}, ${controlPointA} ${props.sourceY + halfWidth}, ${props.sourceX} ${props.sourceY + halfWidth}`,
    'Z',
  ].join(' ')

  return <path d={path} fill={fill} stroke="none" />
}

export default function PortfolioFlowSankey({
  title,
  subtitle,
  totalWeight,
  topHoldingsWeight,
  data,
}: PortfolioFlowSankeyProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateReady = () => {
      const rect = element.getBoundingClientRect()
      setIsReady(rect.width > 0 && rect.height > 0)
    }

    updateReady()
    const observer = new ResizeObserver(() => updateReady())
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const residualWeight = Math.max(0, totalWeight - topHoldingsWeight)

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b1220] shadow-[0_24px_80px_-28px_rgba(15,23,42,0.7)]">
      <div className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(110,167,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0))] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-[20px] font-bold tracking-tight text-white md:text-[22px]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left md:min-w-[260px]">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Sector Coverage
              </div>
              <div className="mt-1 text-[17px] font-bold text-white">{formatPercent(totalWeight)}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Top Holdings
              </div>
              <div className="mt-1 text-[17px] font-bold text-white">{formatPercent(topHoldingsWeight)}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Residual Bucket
              </div>
              <div className="mt-1 text-[17px] font-bold text-white">{formatPercent(residualWeight)}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Flow Model
              </div>
              <div className="mt-1 text-[17px] font-bold text-white">Live ETF Map</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 pb-4 pt-3 md:px-4 md:pb-5">
        <div ref={containerRef} className="h-[520px] w-full min-w-0 md:h-[560px]">
          {isReady ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={400}>
              <Sankey
                data={data}
                node={FlowNode}
                link={FlowLink}
                nodePadding={28}
                nodeWidth={18}
                margin={{ top: 40, right: 24, bottom: 24, left: 24 }}
                sort
              />
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 px-3 text-[12px] font-medium text-slate-400 md:px-4">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#6ea7ff]" />
            Sector exposures
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7de4d3]" />
            Total portfolio allocation
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f2c66d]" />
            Largest disclosed holdings
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4c5f7c]" />
            Residual grouped bucket
          </span>
        </div>
      </div>
    </section>
  )
}
