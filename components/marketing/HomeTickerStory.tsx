'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { Activity } from 'lucide-react'
import { GlassPanel } from '@/components/marketing/site-chrome'
import { cn } from '@/lib/utils'

type TickerTone = 'bullish' | 'defensive' | 'watch'

type TickerCardData = {
  symbol: string
  name: string
  price: string
  move: string
  moveClassName: string
  tone: TickerTone
  posture: string
  read: string
  chips: string[]
  sparkline: string
}

type LayoutPoint = {
  x: number
  y: number
  rotate: number
}

type CapturedTickerSource = {
  sourceHeight: number
  sourceWidth: number
  sourceX: number
  sourceY: number
  trackIndex?: number
}

type CapturedFrame = {
  mode: 'desktop' | 'mobile'
  sources: CapturedTickerSource[]
  viewportWidth: number
}

const tickerCards: TickerCardData[] = [
  {
    symbol: 'SPY',
    name: 'S&P 500',
    price: '598.40',
    move: '+1.2%',
    moveClassName: 'text-[#167a00] dark:text-[#75ff17]',
    tone: 'bullish',
    posture: 'Risk on',
    read: 'Breadth and trend are still pressing higher.',
    chips: ['Breadth 74', 'Vol calm'],
    sparkline: '8,58 28,50 46,52 64,36 82,40 100,22',
  },
  {
    symbol: 'QQQ',
    name: 'Nasdaq 100',
    price: '511.82',
    move: '+0.8%',
    moveClassName: 'text-[#167a00] dark:text-[#75ff17]',
    tone: 'bullish',
    posture: 'Momentum lead',
    read: 'Leadership remains concentrated but still expanding.',
    chips: ['Lead group', 'Trend +'],
    sparkline: '8,62 28,48 46,45 64,34 82,30 100,24',
  },
  {
    symbol: 'VIX',
    name: 'Volatility',
    price: '14.3',
    move: '-1.8%',
    moveClassName: 'text-[#d85a1d]',
    tone: 'watch',
    posture: 'Pressure off',
    read: 'Volatility compression is helping risk stay clean.',
    chips: ['Stress low', 'Range cool'],
    sparkline: '8,18 28,22 46,28 64,34 82,48 100,54',
  },
  {
    symbol: 'TLT',
    name: 'Long Bonds',
    price: '88.22',
    move: '-0.5%',
    moveClassName: 'text-[#d85a1d]',
    tone: 'defensive',
    posture: 'No bid',
    read: 'Rates are not offering a clean safety bid here.',
    chips: ['Duration weak', 'Macro mixed'],
    sparkline: '8,24 28,30 46,38 64,44 82,50 100,56',
  },
  {
    symbol: 'GLD',
    name: 'Gold',
    price: '318.90',
    move: '+0.1%',
    moveClassName: 'text-[#167a00] dark:text-[#75ff17]',
    tone: 'watch',
    posture: 'Quiet hedge',
    read: 'Still acting like a hedge, not a panic tell.',
    chips: ['Hedge live', 'Panic off'],
    sparkline: '8,50 28,42 46,38 64,34 82,32 100,30',
  },
]

const desktopCollapsedLayout: LayoutPoint[] = [
  { x: -404, y: 0, rotate: 0 },
  { x: -202, y: 0, rotate: 0 },
  { x: 0, y: 0, rotate: 0 },
  { x: 202, y: 0, rotate: 0 },
  { x: 404, y: 0, rotate: 0 },
]

const desktopLayout: LayoutPoint[] = [
  { x: -278, y: 86, rotate: -4 },
  { x: 0, y: 112, rotate: -1 },
  { x: 278, y: 86, rotate: 4 },
  { x: -138, y: 250, rotate: 2 },
  { x: 138, y: 246, rotate: -2 },
]

const mobileLayout: LayoutPoint[] = [
  { x: 0, y: 62, rotate: -2 },
  { x: 0, y: 188, rotate: 1 },
  { x: 0, y: 314, rotate: -1 },
  { x: 0, y: 440, rotate: 2 },
  { x: 0, y: 566, rotate: -1 },
]

const TRANSFORM_ACTIVATION_OFFSET = 460
const TRANSFORM_DURATION_RATIO = 0.68
const DESKTOP_CAPTURE_START = 0.1
const MOBILE_CAPTURE_START = 0.12

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function easeInOut(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function rangeProgress(value: number, start: number, end: number) {
  return clamp((value - start) / (end - start), 0, 1)
}

function toneClasses(tone: TickerTone) {
  if (tone === 'bullish') {
    return {
      chip: 'border-[#167a00]/18 bg-[#167a00]/8 text-[#167a00] dark:border-[#75ff17]/18 dark:bg-[#75ff17]/10 dark:text-[#a1ff56]',
      accent: 'bg-[radial-gradient(circle_at_top,rgba(22,122,0,0.14),transparent_68%)] dark:bg-[radial-gradient(circle_at_top,rgba(117,255,23,0.1),transparent_68%)]',
    }
  }
  if (tone === 'defensive') {
    return {
      chip: 'border-[#d85a1d]/20 bg-[#d85a1d]/8 text-[#d85a1d] dark:border-[#ff9b63]/22 dark:bg-[#ff9b63]/10 dark:text-[#ffb17d]',
      accent: 'bg-[radial-gradient(circle_at_top,rgba(216,90,29,0.14),transparent_68%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,155,99,0.12),transparent_68%)]',
    }
  }
  return {
    chip: 'border-[#6f79ff]/20 bg-[#6f79ff]/8 text-[#4d57ff] dark:border-[#94a0ff]/20 dark:bg-[#94a0ff]/10 dark:text-[#b8c0ff]',
    accent: 'bg-[radial-gradient(circle_at_top,rgba(111,121,255,0.14),transparent_68%)] dark:bg-[radial-gradient(circle_at_top,rgba(148,160,255,0.12),transparent_68%)]',
  }
}

function getCardZIndex(index: number) {
  const zIndexes = [29, 34, 33, 31, 30]
  return zIndexes[index] ?? 28
}

function buildDesktopFallbackSources(viewportWidth: number): CapturedTickerSource[] {
  return desktopCollapsedLayout.map((point) => ({
    sourceHeight: 42,
    sourceWidth: 176,
    sourceX: viewportWidth / 2 + point.x - 88,
    sourceY: 60,
  }))
}

function buildMobileFallbackSources(viewportWidth: number): CapturedTickerSource[] {
  const width = Math.min(viewportWidth - 48, 320)
  return tickerCards.map((_, index) => ({
    sourceHeight: 42,
    sourceWidth: width,
    sourceX: (viewportWidth - width) / 2,
    sourceY: 52 + index * 54,
  }))
}

function captureDesktopFrame({
  viewportRef,
  trackViewportRef,
  itemRefs,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  trackViewportRef: RefObject<HTMLDivElement | null>
  itemRefs: RefObject<Array<HTMLDivElement | null>>
}): CapturedFrame | null {
  const viewportRect = viewportRef.current?.getBoundingClientRect()
  const trackViewportRect = trackViewportRef.current?.getBoundingClientRect()

  if (!viewportRect || !trackViewportRect) {
    return null
  }

  const visibleEntries = itemRefs.current
    .map((node, index) => {
      if (!node) return null
      const itemRect = node.getBoundingClientRect()
      const itemCenter = itemRect.left + itemRect.width / 2
      const visibleLeft = trackViewportRect.left + 16
      const visibleRight = trackViewportRect.right - 16

      if (itemCenter <= visibleLeft || itemCenter >= visibleRight) {
        return null
      }

      return {
        center: itemCenter,
        sourceHeight: Math.round(itemRect.height),
        sourceWidth: Math.round(itemRect.width),
        sourceX: Math.round(itemRect.left - viewportRect.left),
        sourceY: Math.round(itemRect.top - viewportRect.top),
        symbol: tickerCards[index % tickerCards.length].symbol,
        trackIndex: index,
      }
    })
    .filter(
      (
        entry
      ): entry is {
        center: number
        sourceHeight: number
        sourceWidth: number
        sourceX: number
        sourceY: number
        symbol: string
        trackIndex: number
      } => entry !== null
    )

  const sources = tickerCards.map((item) => {
    const symbolEntries = visibleEntries
      .filter((entry) => entry.symbol === item.symbol)
      .sort((a, b) => Math.abs(a.center - window.innerWidth / 2) - Math.abs(b.center - window.innerWidth / 2))

    const entry = symbolEntries[0]
    if (!entry) return null

    return {
      sourceHeight: entry.sourceHeight,
      sourceWidth: entry.sourceWidth,
      sourceX: entry.sourceX,
      sourceY: entry.sourceY,
      trackIndex: entry.trackIndex,
    }
  })

  if (sources.some((source) => source === null)) {
    return null
  }

  return {
    mode: 'desktop',
    sources: sources as CapturedTickerSource[],
    viewportWidth: Math.round(viewportRect.width),
  }
}

function captureMobileFrame({
  viewportRef,
  itemRefs,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  itemRefs: RefObject<Array<HTMLDivElement | null>>
}): CapturedFrame | null {
  const viewportRect = viewportRef.current?.getBoundingClientRect()

  if (!viewportRect || itemRefs.current.length < tickerCards.length) {
    return null
  }

  const sources = itemRefs.current
    .slice(0, tickerCards.length)
    .map((node) => {
      if (!node) return null
      const itemRect = node.getBoundingClientRect()

      return {
        sourceHeight: Math.round(itemRect.height),
        sourceWidth: Math.round(itemRect.width),
        sourceX: Math.round(itemRect.left - viewportRect.left),
        sourceY: Math.round(itemRect.top - viewportRect.top),
      }
    })

  if (sources.some((source) => source === null)) {
    return null
  }

  return {
    mode: 'mobile',
    sources: sources as CapturedTickerSource[],
    viewportWidth: Math.round(viewportRect.width),
  }
}

function CompactTickerRow({
  item,
  className,
  textOpacity = 1,
}: {
  item: TickerCardData
  className?: string
  textOpacity?: number
}) {
  return (
    <div
      className={cn('flex w-full items-center gap-3 whitespace-nowrap', className)}
      style={{ opacity: textOpacity }}
    >
      <span className="size-2 rounded-full bg-[#0757ff] shadow-[0_0_16px_rgba(7,87,255,0.85)]" />
      <span className="font-semibold tracking-[0.16em] text-slate-950 dark:text-white">{item.symbol}</span>
      <span className="text-slate-500 dark:text-white/52">{item.price}</span>
      <span className={item.moveClassName}>{item.move}</span>
    </div>
  )
}

function TransformingTickerCard({
  item,
  source,
  target,
  progress,
  isMobile,
  viewportWidth,
  zIndex,
}: {
  item: TickerCardData
  source: CapturedTickerSource
  target: LayoutPoint
  progress: number
  isMobile: boolean
  viewportWidth: number
  zIndex: number
}) {
  const tone = toneClasses(item.tone)
  const freeze = easeInOut(rangeProgress(progress, 0.1, 0.3))
  const travel = easeInOut(rangeProgress(progress, 0.3, 0.82))
  const expandWidth = easeInOut(rangeProgress(progress, 0.45, 0.82))
  const expandHeight = easeOutCubic(rangeProgress(progress, 0.45, 0.85))
  const primaryDetails = easeInOut(rangeProgress(progress, 0.46, 0.72))
  const secondaryDetails = easeInOut(rangeProgress(progress, 0.72, 1))
  const rotation = easeInOut(rangeProgress(progress, 0.54, 0.9))
  const detachLift = easeOutCubic(rangeProgress(progress, 0.3, 0.52))

  const expandedWidth = isMobile ? 272 : 288
  const expandedHeight = isMobile ? 264 : 304
  const width = lerp(source.sourceWidth, expandedWidth, expandWidth)
  const height = lerp(source.sourceHeight, expandedHeight, expandHeight)
  const sourceCenterX = source.sourceX + source.sourceWidth / 2
  const centerX = lerp(sourceCenterX, viewportWidth / 2 + target.x, travel)
  const left = centerX - width / 2
  const top = lerp(source.sourceY, source.sourceY + target.y, travel) - lerp(0, 10, detachLift * (1 - primaryDetails))
  const shellRadius = lerp(Math.min(source.sourceHeight / 2 + 4, 24), 28, expandWidth)
  const compactOpacity = clamp(1 - rangeProgress(progress, 0.72, 0.9), 0, 1)
  const shellScale = lerp(1, 1.028, freeze * (1 - expandWidth))
  const pieceShadow = easeInOut(rangeProgress(progress, 0.32, 0.62))
  const cardShadow = easeInOut(rangeProgress(progress, 0.58, 0.92))

  return (
    <div
      className="pointer-events-none absolute top-0 will-change-transform"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: `rotate(${lerp(0, target.rotate, rotation)}deg)`,
        zIndex,
      }}
    >
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${shellRadius}px`,
          overflow: 'hidden',
          transform: `scale(${shellScale})`,
          boxShadow:
            `inset 0 1px 0 rgba(255,255,255,${lerp(0.56, 0.9, pieceShadow)}), ` +
            `0 ${lerp(2, 18, pieceShadow)}px ${lerp(8, 46, pieceShadow)}px rgba(16,28,45,${lerp(0.02, 0.08, pieceShadow)}), ` +
            `0 ${lerp(0, 26, cardShadow)}px ${lerp(0, 84, cardShadow)}px rgba(16,28,45,${lerp(0, 0.16, cardShadow)})`,
        }}
      >
        <GlassPanel className="relative h-full overflow-hidden border-white/60 bg-white/[0.86] p-0 shadow-none dark:border-white/16 dark:bg-[#08111d]/86">
          <div
            className={`absolute inset-0 ${tone.accent}`}
            style={{ opacity: lerp(0.06, 0.5, expandHeight) }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent_56%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_56%)]"
            style={{ opacity: lerp(0.4, 0.9, freeze) }}
            aria-hidden="true"
          />

          <div
            className="absolute inset-x-0 top-0 z-10 flex px-4"
            style={{
              height: `${Math.max(source.sourceHeight + 10, 42)}px`,
              opacity: compactOpacity,
              alignItems: 'center',
              transform: `translate3d(${lerp(0, -10, primaryDetails)}px, ${lerp(0, Math.min(height * 0.22, 42), primaryDetails)}px, 0)`,
            }}
          >
            <CompactTickerRow item={item} className="justify-start text-[0.8rem]" />
          </div>

          <div className="relative z-10 h-full p-5">
            <div
              className="flex items-start justify-between gap-3"
              style={{
                opacity: primaryDetails,
                transform: `translate3d(0, ${lerp(20, 0, primaryDetails)}px, 0)`,
              }}
            >
              <div>
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/42">
                  {item.symbol}
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{item.name}</div>
              </div>
              <div className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${tone.chip}`}>
                {item.posture}
              </div>
            </div>

            <div
              className="mt-5 flex items-end justify-between gap-3"
              style={{
                opacity: primaryDetails,
                transform: `translate3d(0, ${lerp(28, 0, primaryDetails)}px, 0)`,
              }}
            >
              <div>
                <div className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{item.price}</div>
                <div className={`mt-1 text-sm font-semibold ${item.moveClassName}`}>{item.move}</div>
              </div>
              <svg viewBox="0 0 108 64" className="h-16 w-28 overflow-visible">
                <path
                  d={`M ${item.sparkline}`}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  className="text-[#0757ff] dark:text-[#8590ff]"
                />
              </svg>
            </div>

            <p
              className="mt-5 text-sm leading-6 text-slate-600 dark:text-white/62"
              style={{
                opacity: secondaryDetails,
                transform: `translate3d(0, ${lerp(12, 0, secondaryDetails)}px, 0)`,
              }}
            >
              {item.read}
            </p>

            <div
              className="mt-5 flex flex-wrap gap-2"
              style={{
                opacity: secondaryDetails,
                transform: `translate3d(0, ${lerp(12, 0, secondaryDetails)}px, 0)`,
              }}
            >
              {item.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-950/8 bg-white/65 px-2.5 py-1 text-[0.72rem] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/66"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

function DesktopSourceRail({
  opacity,
  isFrozen,
  trackViewportRef,
  itemRefs,
  hiddenTrackIndexes,
  selectedTrackIndexes,
  focusProgress,
  selectedTextOpacity,
  slotProgress,
}: {
  opacity: number
  isFrozen: boolean
  trackViewportRef: RefObject<HTMLDivElement | null>
  itemRefs: RefObject<Array<HTMLDivElement | null>>
  hiddenTrackIndexes: Set<number>
  selectedTrackIndexes: Set<number>
  focusProgress: number
  selectedTextOpacity: number
  slotProgress: number
}) {
  return (
    <div
      className="absolute inset-x-6 top-8 z-20 hidden overflow-hidden rounded-full border border-white/44 bg-white/[0.12] py-3 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_16px_56px_rgba(18,36,54,0.1)] backdrop-blur-[30px] saturate-[1.8] dark:border-white/14 dark:bg-white/[0.035] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_70px_rgba(0,0,0,0.34)] lg:block"
      style={{
        opacity,
        transform: `translate3d(0, ${lerp(0, 8, 1 - opacity)}px, 0) scale(${lerp(1, 0.985, 1 - opacity)})`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-2 left-5 right-40 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]"
        aria-hidden="true"
      />

      <div ref={trackViewportRef} className="relative mr-36 overflow-hidden">
        <div
          className="marketing-ticker-track flex w-max items-center gap-2.5 whitespace-nowrap px-5 py-1 text-sm xl:text-base"
          style={{
            animationPlayState: isFrozen ? 'paused' : 'running',
          }}
        >
          {[...tickerCards, ...tickerCards].map((item, index) => {
            const isSelected = selectedTrackIndexes.has(index)
            const isHidden = hiddenTrackIndexes.has(index)

            return (
              <div
                key={`${item.symbol}-${index}`}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                className="relative shrink-0"
              >
                {index > 0 ? (
                  <div
                    className="pointer-events-none absolute -left-[5px] inset-y-[10px] w-px bg-slate-950/8 dark:bg-white/10"
                    aria-hidden="true"
                  />
                ) : null}

                <div
                  className={cn(
                    'relative overflow-hidden rounded-[1.1rem] border px-4 py-2',
                    'border-white/30 bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_24px_rgba(20,33,51,0.04)]',
                    'dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(0,0,0,0.18)]'
                  )}
                  style={{
                    opacity: isHidden ? lerp(0.92, 0.36, slotProgress) : 1,
                    transform: isSelected ? `scale(${lerp(1, 1.025, focusProgress * (1 - slotProgress))})` : 'scale(1)',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08)_60%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02)_60%)]"
                    style={{ opacity: isSelected ? lerp(0.45, 0.9, focusProgress) : 0.38 }}
                    aria-hidden="true"
                  />

                  <CompactTickerRow
                    item={item}
                    textOpacity={isHidden ? selectedTextOpacity : 1}
                    className="relative z-10 justify-start text-[0.78rem]"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full border border-white/34 bg-white/[0.16] px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-[26px] dark:border-white/12 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_rgba(0,0,0,0.28)]">
        <Activity className="size-4" aria-hidden="true" />
        <span>Live now</span>
      </div>
    </div>
  )
}

function MobileSourceRail({
  opacity,
  itemRefs,
  hiddenIndexes,
  focusProgress,
  selectedTextOpacity,
  slotProgress,
}: {
  opacity: number
  itemRefs: RefObject<Array<HTMLDivElement | null>>
  hiddenIndexes: Set<number>
  focusProgress: number
  selectedTextOpacity: number
  slotProgress: number
}) {
  return (
    <div
      className="absolute left-1/2 top-8 z-20 w-[min(94vw,22rem)] -translate-x-1/2 rounded-[2rem] border border-white/44 bg-white/[0.12] px-4 py-3 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_16px_56px_rgba(18,36,54,0.1)] backdrop-blur-[30px] saturate-[1.8] dark:border-white/14 dark:bg-white/[0.035] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_70px_rgba(0,0,0,0.34)] lg:hidden"
      style={{
        opacity,
        transform: `translate3d(-50%, ${lerp(0, 8, 1 - opacity)}px, 0) scale(${lerp(1, 0.985, 1 - opacity)})`,
      }}
    >
      <div className="grid gap-2.5">
        {tickerCards.map((item, index) => {
          const isHidden = hiddenIndexes.has(index)

          return (
            <div
              key={item.symbol}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              className="relative overflow-hidden rounded-[1.1rem] border border-white/30 bg-white/[0.14] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_24px_rgba(20,33,51,0.04)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(0,0,0,0.18)]"
              style={{
                opacity: isHidden ? lerp(0.92, 0.3, slotProgress) : 1,
                transform: `scale(${lerp(1, 1.02, focusProgress * (1 - slotProgress))})`,
              }}
            >
              <div
                className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08)_60%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02)_60%)]"
                style={{ opacity: lerp(0.42, 0.78, focusProgress) }}
                aria-hidden="true"
              />
              <CompactTickerRow
                item={item}
                textOpacity={isHidden ? selectedTextOpacity : 1}
                className="relative z-10 justify-center text-sm"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TickerSceneBackground() {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 top-[4.5rem] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.78)_4.5rem,rgba(255,255,255,0.98)_52%),radial-gradient(circle_at_20%_24%,rgba(7,87,255,0.12),transparent_30%),radial-gradient(circle_at_82%_26%,rgba(255,139,43,0.1),transparent_22%)] dark:bg-[linear-gradient(180deg,transparent,rgba(0,4,10,0.72)_4.5rem,rgba(0,4,10,0.98)_52%),radial-gradient(circle_at_20%_24%,rgba(7,87,255,0.18),transparent_30%),radial-gradient(circle_at_82%_26%,rgba(255,139,43,0.1),transparent_22%)] md:top-20" />
      <div className="absolute inset-x-0 bottom-0 top-[4.5rem] opacity-[0.28] [mask-image:linear-gradient(180deg,transparent,black_5rem)] [background-image:linear-gradient(rgba(17,24,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,42,0.04)_1px,transparent_1px)] [background-size:40px_40px] dark:opacity-[0.1] md:top-20" />
    </>
  )
}

export default function HomeTickerStory() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const desktopTrackViewportRef = useRef<HTMLDivElement | null>(null)
  const desktopItemRefs = useRef<Array<HTMLDivElement | null>>([])
  const mobileItemRefs = useRef<Array<HTMLDivElement | null>>([])
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1280)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [capturedFrame, setCapturedFrame] = useState<CapturedFrame | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncReducedMotion = () => {
      setReducedMotion(media.matches)
      setViewportWidth(window.innerWidth)
      setIsMobile(window.innerWidth < 1024)
    }

    syncReducedMotion()
    media.addEventListener('change', syncReducedMotion)
    window.addEventListener('resize', syncReducedMotion)

    return () => {
      media.removeEventListener('change', syncReducedMotion)
      window.removeEventListener('resize', syncReducedMotion)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    let frame = 0

    const requestUpdate = () => {
      if (frame) return

      frame = window.requestAnimationFrame(() => {
        frame = 0

        const section = sectionRef.current
        const viewport = viewportRef.current
        if (!section || !viewport) return

        const rect = section.getBoundingClientRect()
        const viewportRect = viewport.getBoundingClientRect()
        const nextIsMobile = window.innerWidth < 1024
        const viewportHeight = window.innerHeight
        const total = Math.max(section.offsetHeight - viewportHeight, 1)
        const traveled = clamp(TRANSFORM_ACTIVATION_OFFSET - rect.top, 0, total)
        const transformDuration = Math.max(total * TRANSFORM_DURATION_RATIO, 1)
        const nextProgress = clamp(traveled / transformDuration, 0, 1)
        const captureStart = nextIsMobile ? MOBILE_CAPTURE_START : DESKTOP_CAPTURE_START

        setProgress(nextProgress)
        setIsMobile(nextIsMobile)
        setViewportWidth(Math.round(viewportRect.width))

        if (nextProgress < captureStart) {
          setCapturedFrame(null)
          return
        }

        const nextFrame = nextIsMobile
          ? captureMobileFrame({
              itemRefs: mobileItemRefs,
              viewportRef,
            })
          : captureDesktopFrame({
              itemRefs: desktopItemRefs,
              trackViewportRef: desktopTrackViewportRef,
              viewportRef,
            })

        if (!nextFrame) {
          setCapturedFrame((current) => (current?.mode === (nextIsMobile ? 'mobile' : 'desktop') ? current : null))
          return
        }

        setCapturedFrame((current) => {
          if (
            current &&
            current.mode === nextFrame.mode &&
            current.viewportWidth === nextFrame.viewportWidth &&
            current.sources.length === nextFrame.sources.length &&
            current.sources.every(
              (source, index) =>
                source.sourceX === nextFrame.sources[index]?.sourceX &&
                source.sourceY === nextFrame.sources[index]?.sourceY &&
                source.sourceWidth === nextFrame.sources[index]?.sourceWidth &&
                source.sourceHeight === nextFrame.sources[index]?.sourceHeight &&
                source.trackIndex === nextFrame.sources[index]?.trackIndex
            )
          ) {
            return current
          }

          return nextFrame
        })
      })
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [reducedMotion])

  const effectiveProgress = reducedMotion ? 1 : progress
  const desktopFocus = easeInOut(rangeProgress(effectiveProgress, 0.1, 0.3))
  const mobileFocus = easeInOut(rangeProgress(effectiveProgress, 0.12, 0.28))
  const slotProgress = easeInOut(rangeProgress(effectiveProgress, 0.3, 0.56))
  const selectedRailTextOpacity = lerp(1, 0.16, easeInOut(rangeProgress(effectiveProgress, 0.42, 0.72)))
  const railOpacity = reducedMotion ? 0 : lerp(1, 0.14, easeOutCubic(rangeProgress(effectiveProgress, 0.36, 0.76)))
  const layout = isMobile ? mobileLayout : desktopLayout
  const captureStart = isMobile ? MOBILE_CAPTURE_START : DESKTOP_CAPTURE_START
  const fallbackSources = isMobile
    ? buildMobileFallbackSources(viewportWidth)
    : buildDesktopFallbackSources(viewportWidth)
  const sourceFrame =
    capturedFrame?.mode === (isMobile ? 'mobile' : 'desktop')
      ? capturedFrame
      : {
          mode: isMobile ? 'mobile' : 'desktop',
          sources: fallbackSources,
          viewportWidth,
        }
  const shellsActive = reducedMotion || effectiveProgress >= captureStart
  const slotCutoverActive = reducedMotion || effectiveProgress >= 0.3
  const activeTrackIndexes = new Set(
    !isMobile && capturedFrame?.mode === 'desktop'
      ? capturedFrame.sources.map((source) => source.trackIndex).filter((value): value is number => typeof value === 'number')
      : []
  )
  const hiddenDesktopTrackIndexes = new Set(slotCutoverActive ? activeTrackIndexes : [])
  const hiddenMobileIndexes = new Set(
    slotCutoverActive && (capturedFrame?.mode === 'mobile' || reducedMotion) ? tickerCards.map((_, index) => index) : []
  )

  if (reducedMotion) {
    return (
      <section className="relative overflow-hidden bg-transparent py-8 text-slate-950 dark:text-white md:py-12">
        <div
          ref={viewportRef}
          className="relative mx-auto min-h-[760px] max-w-[1500px] overflow-hidden md:min-h-[700px]"
        >
          <TickerSceneBackground />

          <div className="pointer-events-none absolute inset-0 z-30">
            {tickerCards.map((item, index) => {
              const source = sourceFrame.sources[index] ?? fallbackSources[index]
              const target = layout[index] ?? layout[0]

              return (
                <TransformingTickerCard
                  key={item.symbol}
                  item={item}
                  source={source}
                  target={target}
                  progress={1}
                  isMobile={isMobile}
                  viewportWidth={sourceFrame.viewportWidth}
                  zIndex={getCardZIndex(index)}
                />
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[200vh] bg-transparent text-slate-950 dark:text-white md:h-[190vh]"
    >
      <div
        ref={viewportRef}
        className="sticky top-[100px] h-[calc(100vh-100px)] overflow-hidden md:top-[72px] md:h-[calc(100vh-72px)]"
      >
        <TickerSceneBackground />

        <DesktopSourceRail
          opacity={railOpacity}
          isFrozen={!isMobile && effectiveProgress >= DESKTOP_CAPTURE_START}
          trackViewportRef={desktopTrackViewportRef}
          itemRefs={desktopItemRefs}
          hiddenTrackIndexes={hiddenDesktopTrackIndexes}
          selectedTrackIndexes={activeTrackIndexes}
          focusProgress={desktopFocus}
          selectedTextOpacity={selectedRailTextOpacity}
          slotProgress={slotProgress}
        />

        <MobileSourceRail
          opacity={railOpacity}
          itemRefs={mobileItemRefs}
          hiddenIndexes={hiddenMobileIndexes}
          focusProgress={mobileFocus}
          selectedTextOpacity={selectedRailTextOpacity}
          slotProgress={slotProgress}
        />

        <div className="pointer-events-none absolute inset-0 z-30">
          {shellsActive
            ? tickerCards.map((item, index) => {
                const source = sourceFrame.sources[index] ?? fallbackSources[index]
                const target = layout[index] ?? layout[0]

                return (
                  <TransformingTickerCard
                    key={item.symbol}
                    item={item}
                    source={source}
                    target={target}
                    progress={effectiveProgress}
                    isMobile={isMobile}
                    viewportWidth={sourceFrame.viewportWidth}
                    zIndex={getCardZIndex(index)}
                  />
                )
              })
            : null}
        </div>
      </div>
    </section>
  )
}
