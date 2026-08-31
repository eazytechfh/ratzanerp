-- Migration 008: permite saber quando a conta a pagar foi criada (janela de edição de 5 minutos).
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

alter table contas_pagar
  add column if not exists criado_em timestamptz not null default now();
