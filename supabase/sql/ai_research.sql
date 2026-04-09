-- AI research prompt history and feedback capture.
-- Uses server-side writes with SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.ai_research_runs (
  id bigserial primary key,
  user_id text,
  ticker text not null,
  prompt_label text,
  question text,
  signal_direction text not null,
  conviction numeric,
  prediction_horizon integer,
  signal_date date,
  provider text,
  model text,
  status text not null default 'started',
  response_excerpt text,
  citations jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_ai_research_runs_user_created
  on public.ai_research_runs (user_id, created_at desc);

create index if not exists idx_ai_research_runs_ticker_created
  on public.ai_research_runs (ticker, created_at desc);

create table if not exists public.ai_research_feedback (
  id bigserial primary key,
  run_id bigint references public.ai_research_runs(id) on delete set null,
  user_id text,
  ticker text not null,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_research_feedback_user_created
  on public.ai_research_feedback (user_id, created_at desc);

create index if not exists idx_ai_research_feedback_ticker_created
  on public.ai_research_feedback (ticker, created_at desc);

create or replace function public.touch_ai_research_runs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_ai_research_runs_updated_at on public.ai_research_runs;
create trigger trg_touch_ai_research_runs_updated_at
before update on public.ai_research_runs
for each row
execute procedure public.touch_ai_research_runs_updated_at();

alter table public.ai_research_runs enable row level security;
alter table public.ai_research_feedback enable row level security;

drop policy if exists ai_research_runs_public_read on public.ai_research_runs;
drop policy if exists ai_research_feedback_public_read on public.ai_research_feedback;
