-- User watchlists keyed by Clerk user id.
-- Requires server-side writes with SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.user_watchlists (
  id bigserial primary key,
  user_id text not null,
  ticker text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists idx_user_watchlists_user_id
  on public.user_watchlists (user_id);

create index if not exists idx_user_watchlists_ticker
  on public.user_watchlists (ticker);

create or replace function public.touch_user_watchlists_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_user_watchlists_updated_at on public.user_watchlists;
create trigger trg_touch_user_watchlists_updated_at
before update on public.user_watchlists
for each row
execute procedure public.touch_user_watchlists_updated_at();

alter table public.user_watchlists enable row level security;

-- No public policies. Use service role on server only.
drop policy if exists user_watchlists_public_read on public.user_watchlists;
