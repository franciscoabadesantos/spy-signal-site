-- Market cache tables for quote + daily historical prices.
-- Run this in Supabase SQL editor before enabling cron refresh.

create table if not exists public.market_quotes (
  ticker text primary key,
  name text,
  price numeric not null,
  change numeric not null default 0,
  change_percent numeric not null default 0,
  market_cap_text text,
  source text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_price_daily (
  ticker text not null,
  date date not null,
  close numeric not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (ticker, date)
);

create index if not exists idx_market_price_daily_ticker_date_desc
  on public.market_price_daily (ticker, date desc);

create table if not exists public.market_fundamentals (
  ticker text primary key,
  payload jsonb not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_market_quotes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_market_quotes_updated_at on public.market_quotes;
create trigger trg_touch_market_quotes_updated_at
before update on public.market_quotes
for each row
execute procedure public.touch_market_quotes_updated_at();

drop trigger if exists trg_touch_market_fundamentals_updated_at on public.market_fundamentals;
create trigger trg_touch_market_fundamentals_updated_at
before update on public.market_fundamentals
for each row
execute procedure public.touch_market_quotes_updated_at();

alter table public.market_quotes enable row level security;
alter table public.market_price_daily enable row level security;
alter table public.market_fundamentals enable row level security;

drop policy if exists market_quotes_public_read on public.market_quotes;
create policy market_quotes_public_read
on public.market_quotes
for select
using (true);

drop policy if exists market_price_daily_public_read on public.market_price_daily;
create policy market_price_daily_public_read
on public.market_price_daily
for select
using (true);

drop policy if exists market_fundamentals_public_read on public.market_fundamentals;
create policy market_fundamentals_public_read
on public.market_fundamentals
for select
using (true);
