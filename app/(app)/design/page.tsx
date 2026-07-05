import type { Metadata } from 'next'
import { Newsreader, Source_Serif_4 } from 'next/font/google'
import ThemeToggle from '@/components/design/ThemeToggle'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import LockPanel from '@/components/ui/LockPanel'
import PressureBar from '@/components/ui/PressureBar'
import StatChip from '@/components/ui/StatChip'
import TickerCard from '@/components/ui/TickerCard'
import { Star } from 'lucide-react'

// Internal design-kit review page. Not linked from navigation; used to review
// materials, type and kit components in both themes (toggle top-right).

export const metadata: Metadata = {
  title: 'Design kit',
  robots: { index: false, follow: false },
}

const newsreader = Newsreader({ subsets: ['latin'], style: ['italic'], weight: ['400', '500'] })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], style: ['italic'], weight: ['400', '500'] })

const SAMPLE_SENTENCE = 'Volatility compression is helping risk stay clean.'
const SAMPLE_SPARK = [4, 6, 5, 8, 7, 9, 11, 10, 12, 11, 13]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-md text-content-primary">{title}</h2>
      {children}
    </section>
  )
}

export default function DesignKitPage() {
  return (
    <div className="container-lg space-y-12 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md text-content-primary">Design kit</h1>
          <p className="text-body-md mt-1 text-content-secondary">
            Materials, type and components in both themes. Toggle top-right.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Section title="Materials">
        <p className="text-body-sm text-content-muted">
          Glass is chrome only (nav, ticker bar, locks, overlays). Content sits on solid surfaces.
        </p>
        <div
          className="grid grid-cols-1 gap-6 rounded-[var(--radius-2xl)] p-8 md:grid-cols-3"
          style={{
            background:
              'radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 22rem), var(--muted)',
          }}
        >
          <div className="material-glass rounded-[var(--radius-xl)] p-5">
            <div className="text-label-lg">material-glass</div>
            <p className="text-body-sm mt-1 text-content-secondary">Floating chrome: blur, top light, soft depth.</p>
          </div>
          <div className="material-surface rounded-[var(--radius-xl)] p-5">
            <div className="text-label-lg">material-surface</div>
            <p className="text-body-sm mt-1 text-content-secondary">Default content card: solid, crisp border.</p>
          </div>
          <div className="material-surface-raised rounded-[var(--radius-xl)] p-5">
            <div className="text-label-lg">material-surface-raised</div>
            <p className="text-body-sm mt-1 text-content-secondary">Hero-level content block.</p>
          </div>
        </div>
      </Section>

      <Section title="Interpretive serif — pick one">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="material-surface rounded-[var(--radius-xl)] p-6">
            <div className="text-filter-label">Option A — Newsreader</div>
            <p className={`${newsreader.className} mt-3 text-[1.0625rem] italic leading-relaxed text-content-secondary`}>
              {SAMPLE_SENTENCE} Moves together beyond the market. Probably just market noise.
            </p>
          </div>
          <div className="material-surface rounded-[var(--radius-xl)] p-6">
            <div className="text-filter-label">Option B — Source Serif 4 (chosen)</div>
            <p className={`${sourceSerif.className} mt-3 text-[1.0625rem] italic leading-relaxed text-content-secondary`}>
              {SAMPLE_SENTENCE} Moves together beyond the market. Probably just market noise.
            </p>
          </div>
        </div>
        <p className="text-caption text-content-muted">
          Used exclusively for interpretive sentences via <code>.text-interpretive</code> — never for labels or data.
        </p>
      </Section>

      <Section title="Type scale">
        <div className="material-surface space-y-3 rounded-[var(--radius-xl)] p-6">
          <div className="text-display-md">Display — 40/48</div>
          <div className="text-heading-lg">Heading — 28/36</div>
          <div className="text-body-md">Body — 16/24. Plain language over jargon, always.</div>
          <div className="text-label-md">LABEL — 13/18 semibold</div>
          <div className="text-data-lg">1,234.56 — data, tabular</div>
          <p className="text-interpretive">{SAMPLE_SENTENCE}</p>
          <div className="text-filter-label">Filter label — metadata only</div>
        </div>
      </Section>

      <Section title="Buttons & controls">
        <div className="material-surface flex flex-wrap items-center gap-3 rounded-[var(--radius-xl)] p-6">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <IconButton aria-label="Watchlist demo">
            <Star className="size-4" />
          </IconButton>
          <IconButton aria-label="Watchlist active demo" active>
            <Star className="size-4" fill="currentColor" />
          </IconButton>
          <Badge>Badge</Badge>
        </div>
      </Section>

      <Section title="StatChip">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatChip label="Market cap" value="$1.43T" />
          <StatChip label="P/E" value="20.45" />
          <StatChip label="Div yield" value="0.38%" />
          <StatChip label="VIX" value="14.3" tone="bullish" sentence="Pressure off — calm tape." />
        </div>
      </Section>

      <Section title="PressureBar (replaces gauges)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="material-surface rounded-[var(--radius-lg)] p-4">
            <PressureBar title="Summary" buy={9} neutral={5} sell={13} verdict="neutral" pressure={43} />
          </div>
          <div className="material-surface rounded-[var(--radius-lg)] p-4">
            <PressureBar title="Oscillators" buy={4} neutral={5} sell={1} verdict="buy" pressure={65} />
          </div>
          <div className="material-surface rounded-[var(--radius-lg)] p-4">
            <PressureBar title="Moving averages" buy={5} neutral={0} sell={12} verdict="sell" verdictLabel="Strong Sell" pressure={29} />
          </div>
        </div>
      </Section>

      <Section title="TickerCard">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TickerCard
            ticker="SPY"
            name="S&P 500"
            price="$598.40"
            changePercent={1.2}
            sparkline={SAMPLE_SPARK}
            sentence="Breadth and trend pointing the same way."
            badge="Index"
          />
          <TickerCard ticker="VIX" name="Volatility" price="14.3" changePercent={-1.8} sparkline={[...SAMPLE_SPARK].reverse()} />
          <TickerCard ticker="TLT" name="Long bonds" price="$88.22" changePercent={-0.5} href="/stocks/TLT" />
        </div>
      </Section>

      <Section title="LockPanel">
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)]">
          <div className="material-surface pointer-events-none select-none rounded-[var(--radius-2xl)] p-6 blur-[7px]">
            <div className="text-heading-sm">Full relationship table</div>
            <p className="text-body-sm mt-2 text-content-secondary">
              AMZN · moves together beyond the market · +0.30 · 97% — GH · moves together beyond the market · +0.28 · 97%
              — SUZLON.BO · moves together beyond the market · +0.26 · 66% …
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <LockPanel
              title="See the full picture"
              line="Every layer, every confidence score, exportable research."
              ctaLabel="Become a member"
              ctaHref="/pricing"
            />
          </div>
        </div>
      </Section>
    </div>
  )
}
