/* Header menu tile artwork.
   Inline rather than referenced from CSS: an SVG loaded through mask-image or
   background-image runs in secure static mode, where nothing inside it can
   animate. Inline, every stroke and bar is a real element the tile's hover can
   reach. Ink comes from --tile-ink-a / --tile-ink-b, set per tile. */

import type { CSSProperties } from 'react'

export type TileArtKey = 'long-term' | 'income' | 'short-term' | 'signals'

const BARS = [
  { x: 12, y: 76, h: 28, o: 0.36 },
  { x: 33, y: 70, h: 34, o: 0.44 },
  { x: 54, y: 65, h: 39, o: 0.52 },
  { x: 75, y: 58, h: 46, o: 0.64 },
  { x: 96, y: 50, h: 54, o: 0.78 },
  { x: 117, y: 41, h: 63, o: 0.9 },
  { x: 138, y: 31, h: 73, o: 1 },
]

const DOTS = [
  { cx: 18, cy: 60 },
  { cx: 39, cy: 54 },
  { cx: 60, cy: 49 },
  { cx: 81, cy: 42 },
  { cx: 102, cy: 34 },
  { cx: 123, cy: 25 },
  { cx: 144, cy: 15 },
]

const WICKS = [
  { x: 20, y1: 34, y2: 88 },
  { x: 36, y1: 46, y2: 92 },
  { x: 52, y1: 28, y2: 90 },
  { x: 68, y1: 42, y2: 92 },
  { x: 84, y1: 22, y2: 86 },
  { x: 100, y1: 38, y2: 94 },
  { x: 116, y1: 30, y2: 88 },
  { x: 132, y1: 50, y2: 94 },
  { x: 148, y1: 26, y2: 86 },
]

const CANDLES = [
  { x: 16, y: 52, h: 18 },
  { x: 48, y: 60, h: 22 },
  { x: 80, y: 66, h: 20 },
  { x: 112, y: 54, h: 24 },
  { x: 144, y: 44, h: 20 },
]

function Ink({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="120" x2="160" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="var(--tile-ink-a)" />
        <stop offset="1" stopColor="var(--tile-ink-b)" />
      </linearGradient>
    </defs>
  )
}

/* Long term: one compounding curve over a decade of year ticks. On hover the
   curve redraws left to right and the target locks on behind it. */
function LongTermArt() {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className="tile-art tile-art--long">
      <Ink id="tile-ink-long" />
      <g stroke="url(#tile-ink-long)" strokeLinecap="round">
        <g className="tile-art__ticks" strokeWidth="2" opacity="0.3">
          {[14, 32, 50, 68, 86, 104, 122, 140].map((x, i) => (
            <path key={x} d={`M${x} 104v6`} style={{ '--i': i } as CSSProperties} />
          ))}
        </g>
        <path opacity="0.16" strokeWidth="2" d="M8 104h144" />
        <path
          className="tile-art__ghost"
          opacity="0.24"
          strokeWidth="2.5"
          d="M14 96C44 94 72 86 96 68c18-13 32-30 42-50"
        />
        <path
          className="tile-art__ghost tile-art__ghost--near"
          opacity="0.36"
          strokeWidth="2.5"
          d="M14 99C46 98 76 92 100 76c19-13 34-29 44-48"
        />
        <path
          className="tile-art__curve"
          pathLength="100"
          strokeWidth="4.5"
          d="M14 101C50 100 82 95 106 80c20-13 34-27 44-44"
        />
      </g>
      <g className="tile-art__target">
        <circle cx="150" cy="36" r="7" fill="url(#tile-ink-long)" />
        <circle
          className="tile-art__halo"
          cx="150"
          cy="36"
          r="13"
          stroke="url(#tile-ink-long)"
          strokeWidth="2.5"
          opacity="0.32"
        />
      </g>
    </svg>
  )
}

/* Income: a paid cadence — even pitch is the idea. On hover the bars grow off
   the baseline in sequence and the dots rise with them, one beat at a time. */
function IncomeArt() {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className="tile-art tile-art--income">
      <Ink id="tile-ink-income" />
      <g className="tile-art__bars" fill="url(#tile-ink-income)">
        {BARS.map((bar, i) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={bar.y}
            width="12"
            height={bar.h}
            rx="3"
            opacity={bar.o}
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </g>
      <g className="tile-art__dots" fill="url(#tile-ink-income)" opacity="0.66">
        {DOTS.map((dot, i) => (
          <circle
            key={dot.cx}
            cx={dot.cx}
            cy={dot.cy}
            r="4.5"
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </g>
      <path
        d="M8 108h144"
        stroke="url(#tile-ink-income)"
        strokeWidth="2"
        opacity="0.22"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* Short term: range, not direction. On hover the wicks breathe out of phase and
   the trace redraws, so the whole thing reads as unsettled rather than moving. */
function ShortTermArt() {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className="tile-art tile-art--short">
      <Ink id="tile-ink-short" />
      <g stroke="url(#tile-ink-short)" strokeLinecap="round">
        <g className="tile-art__wicks" strokeWidth="2" opacity="0.36">
          {WICKS.map((wick, i) => (
            <path
              key={wick.x}
              d={`M${wick.x} ${wick.y1}V${wick.y2}`}
              style={{ '--i': i } as CSSProperties}
            />
          ))}
        </g>
        <path opacity="0.22" strokeWidth="2" d="M8 60h144" strokeDasharray="4 7" />
        <path
          className="tile-art__trace"
          pathLength="100"
          strokeWidth="4.5"
          strokeLinejoin="round"
          d="M20 66 36 52 52 78 68 58 84 84 100 46 116 72 132 40 148 62"
        />
      </g>
      <g className="tile-art__candles" fill="url(#tile-ink-short)" opacity="0.46">
        {CANDLES.map((candle, i) => (
          <rect
            key={candle.x}
            x={candle.x}
            y={candle.y}
            width="9"
            height={candle.h}
            rx="2"
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  )
}

/* Signals: a state that flips. A stepped line holds a level, crosses, and holds the
   next one — the flip marker is the whole point, so on hover it lands last. */
function SignalsArt() {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className="tile-art tile-art--signals">
      <Ink id="tile-ink-signals" />
      <g stroke="url(#tile-ink-signals)" strokeLinecap="round">
        <path opacity="0.2" strokeWidth="2" d="M8 60h144" strokeDasharray="4 7" />
        <g className="tile-art__ticks" strokeWidth="2" opacity="0.26">
          {[24, 48, 72, 96, 120, 144].map((x, i) => (
            <path key={x} d={`M${x} 100v8`} style={{ '--i': i } as CSSProperties} />
          ))}
        </g>
        <path
          className="tile-art__trace"
          pathLength="100"
          strokeWidth="4.5"
          strokeLinejoin="round"
          d="M14 84H50V44H86V72H122V32H150"
        />
      </g>
      <g className="tile-art__target">
        <circle cx="86" cy="72" r="6.5" fill="url(#tile-ink-signals)" />
        <circle
          className="tile-art__halo"
          cx="86"
          cy="72"
          r="13"
          stroke="url(#tile-ink-signals)"
          strokeWidth="2.5"
          opacity="0.34"
        />
      </g>
    </svg>
  )
}

export default function TileArt({ art }: { art: TileArtKey }) {
  if (art === 'long-term') return <LongTermArt />
  if (art === 'income') return <IncomeArt />
  if (art === 'signals') return <SignalsArt />
  return <ShortTermArt />
}
