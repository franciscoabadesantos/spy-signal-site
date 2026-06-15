'use client'

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Activity } from 'lucide-react'
import { GlassPanel } from '@/components/marketing/site-chrome'

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

type CapturedDesktopFrame = {
  heights: number[]
  top: number
  widths: number[]
  xs: number[]
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

const mobileCollapsedLayout: LayoutPoint[] = [
  { x: -110, y: 0, rotate: 0 },
  { x: 0, y: 0, rotate: 0 },
  { x: 110, y: 0, rotate: 0 },
  { x: -56, y: 52, rotate: 0 },
  { x: 56, y: 52, rotate: 0 },
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

function TickerSignalCard({
  item,
  style,
  compactWidth,
  compactHeight,
  expand,
  settled,
  isMobile,
}: {
  item: TickerCardData
  style: CSSProperties
  compactWidth: number
  compactHeight: number
  expand: number
  settled: number
  isMobile: boolean
}) {
  const tone = toneClasses(item.tone)
  const expandedWidth = isMobile ? 272 : 288
  const expandedHeight = isMobile ? 264 : 304
  const heightExpand = easeOutCubic(rangeProgress(expand, 0, 0.82))
  const widthExpand = easeInOut(rangeProgress(expand, 0.1, 0.76))
  const surfacePolish = easeInOut(rangeProgress(expand, 0.04, 0.84))
  const shellWidth = lerp(compactWidth, expandedWidth, widthExpand)
  const shellHeight = lerp(compactHeight, expandedHeight, heightExpand)
  const shellRadius = lerp(999, 28, surfacePolish)
  const shellOpacity = clamp(expand / 0.05, 0, 1)
  const compactOpacity = clamp(1 - rangeProgress(expand, 0.04, 0.24), 0, 1)
  const detailOpacity = clamp(expand / 0.08, 0, 1)
  const earlyShadow = clamp(surfacePolish / 0.74, 0, 1)

  return (
    <div className="absolute left-1/2 top-0 will-change-transform" style={style}>
      <div
        style={{
          width: `${shellWidth}px`,
          height: `${shellHeight}px`,
          borderRadius: `${shellRadius}px`,
          opacity: shellOpacity,
          transform: `translateX(-50%) scale(${lerp(0.992, 1, surfacePolish)})`,
          overflow: 'hidden',
          boxShadow:
            `inset 0 1px 0 rgba(255,255,255,${lerp(0.58, 0.88, earlyShadow)}), 0 ${lerp(3, 18, earlyShadow)}px ${lerp(8, 46, earlyShadow)}px rgba(20,33,51,${lerp(0.015, 0.08, earlyShadow)})`,
        }}
      >
        <GlassPanel className="relative h-full overflow-hidden border-white/60 bg-white/[0.86] p-0 shadow-none dark:border-white/16 dark:bg-[#08111d]/86">
          <div
            className={`absolute inset-0 ${tone.accent}`}
            style={{ opacity: lerp(0.04, 0.5, surfacePolish) }}
            aria-hidden="true"
          />

          <div
            className="absolute inset-0 flex items-center justify-center px-4"
            style={{
              opacity: compactOpacity,
              transform: `translate3d(0, ${lerp(0, -8, heightExpand)}px, 0)`,
            }}
          >
            <div className="flex w-full items-center justify-center gap-3 whitespace-nowrap text-[0.8rem]">
              <span className="size-2 rounded-full bg-[#0757ff] shadow-[0_0_16px_rgba(7,87,255,0.9)]" />
              <span className="font-semibold tracking-[0.16em] text-slate-950 dark:text-white">{item.symbol}</span>
              <span className="text-slate-500 dark:text-white/52">{item.price}</span>
              <span className={item.moveClassName}>{item.move}</span>
            </div>
          </div>

          <div
            className="relative z-10 p-5"
            style={{
              opacity: detailOpacity,
              transform: `translate3d(0, ${lerp(16, 0, settled)}px, 0)`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
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

            <div className="mt-5 flex items-end justify-between gap-3">
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
                opacity: detailOpacity,
                transform: `translate3d(0, ${lerp(8, 0, detailOpacity)}px, 0)`,
              }}
            >
              {item.read}
            </p>

            <div
              className="mt-5 flex flex-wrap gap-2"
              style={{
                opacity: detailOpacity,
                transform: `translate3d(0, ${lerp(8, 0, detailOpacity)}px, 0)`,
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
  railRef,
  trackRef,
  itemRefs,
}: {
  opacity: number
  isFrozen: boolean
  railRef: RefObject<HTMLDivElement | null>
  trackRef: RefObject<HTMLDivElement | null>
  itemRefs: RefObject<Array<HTMLDivElement | null>>
}) {
  return (
    <div
      ref={railRef}
      className="absolute inset-x-6 top-8 z-20 hidden overflow-hidden rounded-full border border-white/44 bg-white/[0.12] py-3 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_16px_56px_rgba(18,36,54,0.1)] backdrop-blur-[30px] saturate-[1.8] dark:border-white/14 dark:bg-white/[0.035] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_70px_rgba(0,0,0,0.34)] lg:block"
      style={{
        opacity,
        transform: `translate3d(0, ${lerp(0, 8, 1 - opacity)}px, 0) scale(${lerp(1, 0.985, 1 - opacity)})`,
      }}
    >
      <div className="mr-36 overflow-hidden">
        <div
          ref={trackRef}
          className="marketing-ticker-track flex w-max items-center gap-9 whitespace-nowrap px-6 text-sm xl:text-base"
          style={{
            animationPlayState: isFrozen ? 'paused' : 'running',
          }}
        >
          {[...tickerCards, ...tickerCards].map((item, index) => (
            <div
              key={`${item.symbol}-${index}`}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              className="flex items-center gap-4 whitespace-nowrap"
            >
              <span className="size-2 rounded-full bg-[#0757ff] shadow-[0_0_16px_rgba(7,87,255,0.9)]" />
              <span className="font-medium tracking-wide">{item.symbol}</span>
              <span className="text-slate-500 dark:text-white/52">{item.price}</span>
              <span className={item.moveClassName}>{item.move}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full border border-white/34 bg-white/[0.16] px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-[26px] dark:border-white/12 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_rgba(0,0,0,0.28)]">
        <Activity className="size-4" aria-hidden="true" />
        <span>Live now</span>
      </div>
    </div>
  )
}

function MobileSourceRail({ opacity }: { opacity: number }) {
  return (
    <div
      className="absolute left-1/2 top-8 z-20 w-[min(94vw,22rem)] -translate-x-1/2 rounded-[2rem] border border-white/44 bg-white/[0.12] px-4 py-3 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_16px_56px_rgba(18,36,54,0.1)] backdrop-blur-[30px] saturate-[1.8] dark:border-white/14 dark:bg-white/[0.035] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_70px_rgba(0,0,0,0.34)] lg:hidden"
      style={{
        opacity,
        transform: `translate3d(-50%, ${lerp(0, 8, 1 - opacity)}px, 0) scale(${lerp(1, 0.985, 1 - opacity)})`,
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {tickerCards.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-center gap-3 whitespace-nowrap rounded-full border border-white/34 bg-white/[0.12] px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="size-2 rounded-full bg-[#0757ff] shadow-[0_0_16px_rgba(7,87,255,0.75)]" />
            <span className="font-semibold tracking-wide">{item.symbol}</span>
            <span className="text-slate-500 dark:text-white/52">{item.price}</span>
            <span className={item.moveClassName}>{item.move}</span>
          </div>
        ))}
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
  const desktopRailRef = useRef<HTMLDivElement | null>(null)
  const desktopTrackRef = useRef<HTMLDivElement | null>(null)
  const desktopItemRefs = useRef<Array<HTMLDivElement | null>>([])
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [capturedDesktopFrame, setCapturedDesktopFrame] = useState<CapturedDesktopFrame | null>(null)

  useEffect(() => {
    let frame = 0

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const total = Math.max(section.offsetHeight - viewportHeight, 1)
        const traveled = clamp(TRANSFORM_ACTIVATION_OFFSET - rect.top, 0, total)
        const transformDuration = Math.max(total * TRANSFORM_DURATION_RATIO, 1)
        const nextProgress = clamp(traveled / transformDuration, 0, 1)

        setProgress(nextProgress)
        setIsMobile(window.innerWidth < 768)

        if ((traveled === 0 || nextProgress === 0) && capturedDesktopFrame) {
          setCapturedDesktopFrame(null)
          desktopTrackRef.current?.style.removeProperty('animation-play-state')
          return
        }

        if (window.innerWidth >= 768 && nextProgress > 0 && !capturedDesktopFrame) {
          desktopTrackRef.current?.style.setProperty('animation-play-state', 'paused')

          const railRect = desktopRailRef.current?.getBoundingClientRect()
          const viewportRect = viewportRef.current?.getBoundingClientRect()
          if (!railRect || !viewportRect) return

          const visibleEntries = desktopItemRefs.current
            .map((node, index) => {
              if (!node) return null
              const itemRect = node.getBoundingClientRect()
              const itemCenter = itemRect.left + itemRect.width / 2
              const rightLimit = railRect.right - 176
              if (itemCenter <= railRect.left + 12 || itemCenter >= rightLimit) return null

              return {
                center: itemCenter,
                height: itemRect.height,
                left: itemRect.left,
                symbol: tickerCards[index % tickerCards.length].symbol,
                top: itemRect.top,
                width: itemRect.width,
              }
            })
            .filter((entry): entry is { center: number; height: number; left: number; symbol: string; top: number; width: number } => entry !== null)

          const entriesBySymbol = tickerCards.map((item) => {
            const symbolEntries = visibleEntries
              .filter((entry) => entry.symbol === item.symbol)
              .sort((a, b) => Math.abs(a.center - window.innerWidth / 2) - Math.abs(b.center - window.innerWidth / 2))

            return symbolEntries[0] ?? null
          })

          if (entriesBySymbol.every((entry) => entry !== null)) {
            const capturedEntries = entriesBySymbol as Array<NonNullable<(typeof entriesBySymbol)[number]>>
            setCapturedDesktopFrame({
              heights: capturedEntries.map((entry) => Math.round(entry.height)),
              top: Math.round(capturedEntries[0].top - viewportRect.top),
              widths: capturedEntries.map((entry) => Math.round(entry.width)),
              xs: capturedEntries.map((entry) => Math.round(entry.center - (railRect.left + railRect.width / 2))),
            })
          }
        }
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
  }, [capturedDesktopFrame])

  const expand = progress
  const drop = easeOutCubic(rangeProgress(expand, 0.04, 0.62))
  const spread = easeInOut(rangeProgress(expand, 0.24, 0.92))
  const rotateIn = easeInOut(rangeProgress(expand, 0.38, 1))
  const settle = easeInOut(rangeProgress(progress, 0.08, 0.38))
  const isFrozen = !isMobile && progress > 0
  const isTransforming = progress > 0
  const railOpacity = isTransforming ? lerp(1, 0.08, easeOutCubic(rangeProgress(expand, 0.02, 0.34))) : 1
  const layout = isMobile ? mobileLayout : desktopLayout
  const collapsedLayout = isMobile
    ? mobileCollapsedLayout
    : capturedDesktopFrame
      ? capturedDesktopFrame.xs.map((x) => ({ x, y: 0, rotate: 0 }))
      : desktopCollapsedLayout
  const compactWidths = isMobile
    ? tickerCards.map(() => 132)
    : capturedDesktopFrame?.widths ?? tickerCards.map(() => 168)
  const compactHeights = isMobile
    ? tickerCards.map(() => 28)
    : capturedDesktopFrame?.heights ?? tickerCards.map(() => 24)
  const cardsOriginTop = isMobile ? 68 : capturedDesktopFrame?.top ?? 56

  return (
    <section
      ref={sectionRef}
      className="relative h-[200vh] bg-transparent text-slate-950 dark:text-white md:h-[190vh]"
    >
      <div ref={viewportRef} className="sticky top-[100px] h-[calc(100vh-100px)] overflow-hidden md:top-[72px] md:h-[calc(100vh-72px)]">
        <TickerSceneBackground />

        <DesktopSourceRail
          opacity={railOpacity}
          isFrozen={isFrozen}
          railRef={desktopRailRef}
          trackRef={desktopTrackRef}
          itemRefs={desktopItemRefs}
        />
        <MobileSourceRail opacity={railOpacity} />

        <div className="pointer-events-none absolute inset-x-0 h-[calc(100%-6rem)]" style={{ top: `${cardsOriginTop}px` }}>
          {tickerCards.map((item, index) => {
            const collapsed = collapsedLayout[index] ?? collapsedLayout[0]
            const target = layout[index] ?? layout[0]
            const x = lerp(collapsed.x, target.x, spread)
            const y = lerp(collapsed.y, target.y, drop)
            const rotate = lerp(collapsed.rotate, target.rotate, rotateIn)

            return (
              <TickerSignalCard
                key={item.symbol}
                item={item}
                compactWidth={compactWidths[index] ?? compactWidths[0]}
                compactHeight={compactHeights[index] ?? compactHeights[0]}
                expand={expand}
                settled={settle}
                isMobile={isMobile}
                style={{
                  opacity: clamp(expand / 0.05, 0, 1),
                  transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
                  zIndex: 20 + (index === 1 ? 5 : 0) + (index === 2 ? 4 : 0),
                }}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
