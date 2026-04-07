-- Idempotency table for signal flip alert emails.
-- Prevents duplicate sends for same user/ticker/date/direction.

create table if not exists public.signal_alert_dispatches (
  id bigserial primary key,
  user_id text not null,
  ticker text not null,
  signal_date date not null,
  to_direction text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ticker, signal_date, to_direction)
);

create index if not exists idx_signal_alert_dispatches_user_date
  on public.signal_alert_dispatches (user_id, signal_date desc);

alter table public.signal_alert_dispatches enable row level security;

-- No public policies. Service-role access only.
drop policy if exists signal_alert_dispatches_public_read on public.signal_alert_dispatches;
