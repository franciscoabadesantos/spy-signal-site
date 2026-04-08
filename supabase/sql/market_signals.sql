-- Multi-ticker market signals table + "latest per ticker" view.
-- Run this in Supabase SQL editor to power cross-ticker screener/dashboard data.

create table if not exists public.market_signals (
  id bigserial primary key,
  ticker text not null,
  signal_date date not null,
  direction text not null check (direction in ('bullish', 'neutral', 'bearish')),
  prob_side numeric,
  prediction_horizon integer,
  source text not null default 'model_batch',
  model_version_id text,
  retrain_id text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ticker, signal_date)
);

create index if not exists idx_market_signals_ticker_signal_date_desc
  on public.market_signals (ticker, signal_date desc);

create index if not exists idx_market_signals_signal_date_desc
  on public.market_signals (signal_date desc);

create or replace function public.touch_market_signals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_market_signals_updated_at on public.market_signals;
create trigger trg_touch_market_signals_updated_at
before update on public.market_signals
for each row
execute procedure public.touch_market_signals_updated_at();

create or replace view public.latest_signals_view as
select distinct on (ms.ticker)
  ms.id,
  ms.ticker,
  ms.signal_date,
  ms.direction,
  ms.prob_side,
  ms.prediction_horizon,
  ms.source,
  ms.model_version_id,
  ms.retrain_id,
  ms.metadata,
  ms.created_at,
  ms.updated_at
from public.market_signals ms
order by ms.ticker, ms.signal_date desc, ms.id desc;

alter table public.market_signals enable row level security;

drop policy if exists market_signals_public_read on public.market_signals;
create policy market_signals_public_read
on public.market_signals
for select
using (true);
