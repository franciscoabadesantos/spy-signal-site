# Investment Lens scoring contract

Status: product and frontend contract. Lens-specific scores are **not active** until canonical inputs and an approved calculation exist in `finance-backend`.

The frontend may change hierarchy, chart windows and evidence emphasis by Lens. It must not calculate or imply a Lens Score from these proposed weights.

## Phase 1 Overview decision — approved 2026-07-22

- The ticker identity, price, current signal state, Perspective control and watchlist action form one compact header band. Ticker navigation follows that identity band.
- Overview is the stable primary research surface. Chart, canonical final grade, Technicals, Fundamentals and the Relationships preview remain present across every Perspective.
- Perspective changes chart defaults, module order, relative width and the evidence shown first. It does not remove primary modules, calculate a Lens-specific grade or change backend data.
- The Overview grade is limited to the canonical letter and short qualitative state. Axis scores, weights and methodology belong to the detailed scorecard or methodology destination.
- Dense evidence lives in stable Research destinations. Overview keeps compact interpretations, key values and contextual links rather than full statements or long tables.
- Missing future contracts use restrained preview states. No placeholder contains invented values, series, conclusions or sources.
- The Perspective dial uses semantic radios, URL state, discrete snap positions, keyboard operation, 44px touch targets and a reduced-motion path. Drag previews a selection; the Overview changes only after commit.

### Final screenshot matrix

The combined Phase 1 browser command writes the final matrix under `test-results/`:

- Overview: Trade, Short term, Medium term and Long term desktop states.
- Responsive: Long term mobile and effective 200% zoom.
- Perspective: compact desktop, expanded states, drag preview, mobile, keyboard-selected states and reduced motion.
- Coverage: full equity, partial equity, ETF, Relationships desktop and Relationships mobile.
- Navigation: open Research menu and legacy-route redirect assertions.

## Evidence and proposed weighting

| Lens | Factor | Proposed weight | Canonical input required |
| --- | --- | ---: | --- |
| Trade | Price action | 20% | OHLC returns and trend for the selected short window |
| Trade | Technicals | 25% | Oscillator and moving-average summaries |
| Trade | Momentum | 15% | Canonical momentum evidence |
| Trade | Volatility and liquidity | 15% | 30-day volatility and volume/liquidity fields |
| Trade | Model signal | 15% | Direction, conviction, horizon and signal date |
| Trade | Events and tactical relationships | 10% | Near-term events and approved short-window relationships |
| Short term | Recent signal and trend | 25% | Recent signal history and short-window trend |
| Short term | Technicals and momentum | 20% | Approved short-term technical summaries |
| Short term | Earnings and events | 20% | Next earnings and approved event feed |
| Short term | Catalysts and countercase | 15% | Approved research-context contract |
| Short term | Tactical relationships | 15% | Approved short-window relationship view |
| Short term | Liquidity and volatility | 5% | Canonical liquidity and volatility fields |
| Medium term | Valuation | 20% | Current and historical valuation contracts |
| Medium term | Growth and earnings trend | 25% | Multi-period revenue, EPS and earnings trend |
| Medium term | Business quality | 15% | Profitability, margins and return metrics |
| Medium term | Financial health | 10% | Balance-sheet and cash-flow evidence |
| Medium term | Broader momentum | 10% | Medium-window momentum evidence |
| Medium term | Peers, sector and relationships | 20% | Approved peer, sector and medium-window relationship inputs |
| Long term | Business quality and profitability | 25% | Margins, returns and durable profitability evidence |
| Long term | Financial health | 15% | Debt, cash, solvency and free-cash-flow evidence |
| Long term | Growth | 15% | Multi-year revenue, EPS and free-cash-flow growth |
| Long term | Valuation history | 15% | Historical multiples and range context |
| Long term | Shareholder return | 10% | Dividends, payout and approved buyback fields |
| Long term | Ownership and capital | 10% | Ownership, dilution and capital-structure contract |
| Long term | Structural context | 10% | Company profile, themes, industries and persistent relationships |

Weights are a visible product proposal, not an implemented model. Any change requires product approval and a versioned backend methodology.

## Missing data and confidence

- Weighted coverage is the sum of factors with every required canonical input available.
- Below 50% coverage: Lens Score is unavailable and no directional conclusion is shown.
- From 50% to below 70%: evidence may be displayed, but the score remains unavailable.
- At 70% or above: a provisional score may be calculated only after the backend contract exists.
- A strong conclusion requires at least 85% weighted coverage and all critical factors for that Lens.
- Missing factors are never treated as neutral zeroes and weights are not silently redistributed.
- Confidence must be reported separately from the score and cannot exceed weighted coverage.
- The canonical scorecard and a future Lens Score remain separate outputs with separate methodology labels.

## Frontend states

- `Preview`: final module structure without a live Lens calculation.
- `Pending integration`: the canonical contract is not connected.
- `Partial coverage`: some raw evidence exists, but minimum Lens coverage is not met.
- `Unavailable`: required data is currently absent or invalid.
- `Plan required`: access exists but depends on entitlement.
