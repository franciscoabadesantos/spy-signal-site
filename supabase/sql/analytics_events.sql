-- Analytics event storage for user-testing and product funnel analysis.
-- Intended for server-side writes using SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.analytics_events (
  id bigserial primary key,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  session_id text not null,
  anonymous_id text not null,
  pathname text not null,
  referrer text,
  occurred_at timestamptz not null default now(),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_occurred_at
  on public.analytics_events (occurred_at desc);

create index if not exists idx_analytics_events_event_name
  on public.analytics_events (event_name, occurred_at desc);

create index if not exists idx_analytics_events_session
  on public.analytics_events (session_id, occurred_at desc);

create index if not exists idx_analytics_events_pathname
  on public.analytics_events (pathname, occurred_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists analytics_events_service_role_all on public.analytics_events;
create policy analytics_events_service_role_all
on public.analytics_events
for all
to service_role
using (true)
with check (true);
