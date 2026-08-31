-- Migration 009: integração com Google Calendar (login de cada usuário conecta o próprio calendário).
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).
-- Tokens só são escritos/lidos pelas Edge Functions (service role); o usuário
-- autenticado só enxerga a própria linha (para saber se já conectou ou não).

create table if not exists google_calendar_tokens (
  perfil_id uuid primary key references perfis(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expira_em timestamptz,
  calendar_id text not null default 'primary',
  conectado_em timestamptz not null default now()
);

alter table google_calendar_tokens enable row level security;

drop policy if exists "google_calendar_tokens_own_row" on google_calendar_tokens;
create policy "google_calendar_tokens_own_row" on google_calendar_tokens
  for select using (auth.uid() = perfil_id);

-- Mapeia cada serviço ao evento correspondente no Google Calendar do operador,
-- para permitir atualizar/cancelar o evento certo em vez de duplicar.
create table if not exists google_calendar_eventos (
  servico_id text primary key,
  perfil_id uuid not null references perfis(id) on delete cascade,
  google_event_id text not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists google_calendar_eventos_perfil_idx on google_calendar_eventos(perfil_id);

alter table google_calendar_eventos enable row level security;

drop policy if exists "google_calendar_eventos_own_row" on google_calendar_eventos;
create policy "google_calendar_eventos_own_row" on google_calendar_eventos
  for select using (auth.uid() = perfil_id);
