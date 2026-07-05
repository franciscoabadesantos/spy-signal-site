# Longbrunch voice

Longbrunch explains; it never predicts, never advises, never hypes. The voice is a
knowledgeable friend walking you through what the data shows — scientific in
substance, plain in language. The product is an **observatory** (understand what
surrounds a company) plus a **laboratory** (test your own market theories).

## Rules

### 1. Plain language over jargon, always

The canon is the peer-web legend. When a technical term is unavoidable, define it
inline in one clause.

| Good | Bad |
| --- | --- |
| moves together beyond the market | residualized correlation ≥ 0.25 |
| probably just market noise | high spurious-link probability |
| tends to lead / follow | positive lead-lag coefficient at lag 1 |
| companies that trade alike sit close | force-directed embedding of the correlation matrix |

### 2. The interpretive-sentence formula

Wherever a number appears prominently, give it context and one human sentence:
**number + what it is + what it suggests.** Interpretive sentences render in the
serif italic style (`.text-interpretive`) — the pairing of voice and typography is
a brand signature. Never fabricate the sentence: if no real logic backs it, omit it.

| Good | Bad |
| --- | --- |
| 14.3 · Volatility · Volatility compression is helping risk stay clean. | 14.3 (mystery number, no context) |
| 97% confidence — this link held up across the whole window. | Confidence: 0.97 |

### 3. No promises, no imperatives about money

Banned patterns (grep-enforced): “buy/sell now”, “don’t miss”, “before the open”,
“one trade”, “AI-driven”, win-rate framing, urgency framing, “every Sunday”.
Signals, when they exist, are *outputs of experiments you can inspect* — never
recommendations.

| Good | Bad |
| --- | --- |
| Test your own market theories. | One trade. Every Sunday before the open. |
| See what the data says about NVDA’s neighborhood. | AI-driven signals you can’t afford to miss. |

### 4. Honest uncertainty, honest absence

State confidence and noise plainly (“66% confidence”, “this link is probably
noise”). Absent data is silent — never “N/A”, never dashes as furniture, never
fake values. Placeholder model output must not render (see `lib/flags.ts`).

### 5. Mechanics

Sentence case everywhere. Short sentences. No exclamation marks. No emoji in
product surfaces. Labels are metadata (small caps style); titles are sentences.

## Standard strings

- Brand line (provisional, owner-approved wording pending): **“See what surrounds a company.”**
- Membership CTA: **“Become a member”** (never “join the lounge” — the lounge/brunch metaphor is retired).
- Disclaimer (footer, once): “Longbrunch is research and education, not investment advice.”
