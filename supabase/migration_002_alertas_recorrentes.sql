-- Migration 002: alertas recorrentes + data de vencimento
-- Rode no SQL Editor do Supabase (depois do schema.sql inicial).

alter table alertas
  add column if not exists data_vencimento date not null default current_date,
  add column if not exists recorrente boolean not null default false,
  add column if not exists frequencia text check (frequencia in ('diaria','semanal','mensal'));

create index if not exists alertas_data_vencimento_idx on alertas(data_vencimento);
