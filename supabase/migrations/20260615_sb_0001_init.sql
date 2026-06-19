-- ============================================================================
-- Scaleboard — initial schema (sb_0001_init)
-- Project: oeqorrixgmjlmenpzkio  (WMM hub)
--
-- PRINCIPLES (per integration brief):
--   • Purely additive — NO existing table is altered or dropped.
--   • All new tables prefixed sb_ , live in the public schema.
--   • Client anchor = pm.clients(id) (the wmm-finance-hr / pm client master).
--   • Team identity is REUSED from os_team_members (no sb_members table).
--   • RLS enabled on every table; SELECT/INSERT/UPDATE for WMM members
--     via the existing public.os_is_wmm_member() helper.
-- ============================================================================

-- ── shared updated_at trigger (namespaced, new) ─────────────────────────────
create or replace function public.sb_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. sb_clients — one Scaleboard workspace per pm.clients master record
--    name / acronym / status / ghl_location_id are READ from pm.clients,
--    never duplicated here. Only Scaleboard-specific fields live here.
-- ============================================================================
create table public.sb_clients (
  id            uuid primary key default gen_random_uuid(),
  pm_client_id  uuid not null references pm.clients(id) on delete cascade,
  vertical      text,                                   -- not owned elsewhere
  language      text not null default 'es' check (language in ('es','en')),
  status        text not null default 'onboarding'
                  check (status in ('onboarding','active','paused','archived')),
  created_by    text,                                   -- os_team_members.id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (pm_client_id)                                 -- 1 workspace per client
);
comment on table public.sb_clients is
  'Scaleboard workspace; anchors to pm.clients (wmm-finance-hr master) via pm_client_id.';

-- ============================================================================
-- 2. sb_briefs — committed + draft brief (one of each per client)
-- ============================================================================
create table public.sb_briefs (
  id            uuid primary key default gen_random_uuid(),
  sb_client_id  uuid not null references public.sb_clients(id) on delete cascade,
  status        text not null default 'draft' check (status in ('draft','committed')),
  offer         text,
  icp           text,
  usp           text,
  kpi           text,
  budget        text,
  competitors   jsonb not null default '[]'::jsonb,
  body          text,
  raw_paste     text,
  language      text not null default 'es' check (language in ('es','en')),
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (sb_client_id, status)                         -- 1 draft + 1 committed
);

-- ============================================================================
-- 3. sb_strategy — densification pack (one row per client, jsonb blobs)
-- ============================================================================
create table public.sb_strategy (
  id            uuid primary key default gen_random_uuid(),
  sb_client_id  uuid not null unique references public.sb_clients(id) on delete cascade,
  angles        jsonb not null default '[]'::jsonb,
  hooks         jsonb not null default '[]'::jsonb,
  channels      jsonb not null default '[]'::jsonb,
  landing_page  jsonb not null default '{}'::jsonb,
  user_journey  jsonb not null default '{}'::jsonb,
  generated_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- 4. sb_financials — financial model (one row per client)
-- ============================================================================
create table public.sb_financials (
  id            uuid primary key default gen_random_uuid(),
  sb_client_id  uuid not null unique references public.sb_clients(id) on delete cascade,
  model         jsonb not null default '{}'::jsonb,
  computed_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- 5. sb_creative_requests — many per client
-- ============================================================================
create table public.sb_creative_requests (
  id            uuid primary key default gen_random_uuid(),
  sb_client_id  uuid not null references public.sb_clients(id) on delete cascade,
  slug          text,
  platform      text,
  objective     text,
  funnel_stage  text,
  payload       jsonb not null default '{}'::jsonb,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index sb_creative_requests_client_idx on public.sb_creative_requests(sb_client_id);

-- ============================================================================
-- 6. sb_guidelines — app-level (sb_client_id null) + client-level docs
-- ============================================================================
create table public.sb_guidelines (
  id            uuid primary key default gen_random_uuid(),
  level         text not null check (level in ('app','client')),
  module        text not null,                          -- general|strategy|creative-request|...
  sb_client_id  uuid references public.sb_clients(id) on delete cascade,
  filename      text not null,
  content       text not null default '',
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check ((level = 'app'    and sb_client_id is null)
      or (level = 'client' and sb_client_id is not null))
);
create index sb_guidelines_lookup_idx on public.sb_guidelines(level, module, sb_client_id);

-- ============================================================================
-- 7. sb_readiness — launch-readiness checklist (one per client)
-- ============================================================================
create table public.sb_readiness (
  id            uuid primary key default gen_random_uuid(),
  sb_client_id  uuid not null unique references public.sb_clients(id) on delete cascade,
  items         jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- 8. sb_ai_usage — AI usage log (optional analytics)
-- ============================================================================
create table public.sb_ai_usage (
  id            uuid primary key default gen_random_uuid(),
  sb_client_id  uuid references public.sb_clients(id) on delete set null,
  module        text,
  model         text,
  input_tokens  integer,
  output_tokens integer,
  duration_ms   integer,
  created_at    timestamptz not null default now()
);
create index sb_ai_usage_client_idx on public.sb_ai_usage(sb_client_id);

-- ── updated_at triggers ─────────────────────────────────────────────────────
create trigger sb_clients_uat           before update on public.sb_clients           for each row execute function public.sb_set_updated_at();
create trigger sb_briefs_uat            before update on public.sb_briefs            for each row execute function public.sb_set_updated_at();
create trigger sb_strategy_uat          before update on public.sb_strategy          for each row execute function public.sb_set_updated_at();
create trigger sb_financials_uat        before update on public.sb_financials        for each row execute function public.sb_set_updated_at();
create trigger sb_creative_requests_uat before update on public.sb_creative_requests for each row execute function public.sb_set_updated_at();
create trigger sb_guidelines_uat        before update on public.sb_guidelines        for each row execute function public.sb_set_updated_at();
create trigger sb_readiness_uat         before update on public.sb_readiness         for each row execute function public.sb_set_updated_at();

-- ============================================================================
-- RLS — enable + WMM-member policies (SELECT / INSERT / UPDATE) on all tables
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'sb_clients','sb_briefs','sb_strategy','sb_financials',
    'sb_creative_requests','sb_guidelines','sb_readiness','sb_ai_usage'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format($f$
      create policy %1$s_read on public.%1$I
        for select to authenticated
        using (public.os_is_wmm_member());
    $f$, t);

    execute format($f$
      create policy %1$s_insert on public.%1$I
        for insert to authenticated
        with check (public.os_is_wmm_member());
    $f$, t);

    execute format($f$
      create policy %1$s_update on public.%1$I
        for update to authenticated
        using (public.os_is_wmm_member())
        with check (public.os_is_wmm_member());
    $f$, t);
  end loop;
end $$;

-- ============================================================================
-- END sb_0001_init  — 8 tables, 1 trigger fn, 7 triggers, 24 RLS policies.
-- Existing tables touched: NONE.
-- ============================================================================
