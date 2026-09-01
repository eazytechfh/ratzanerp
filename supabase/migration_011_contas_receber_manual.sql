-- Migration 011: lançamentos manuais no contas a receber (não vinculados a um serviço).
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

create table if not exists contas_receber_manuais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  cliente_nome text not null,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  vencimento date not null,
  status text not null check (status in ('pendente','pago','cancelado')) default 'pendente',
  data_pagamento date,
  criado_em timestamptz not null default now()
);

create index if not exists contas_receber_manuais_cliente_idx on contas_receber_manuais(cliente_id);

alter table contas_receber_manuais enable row level security;

drop policy if exists "allow_all_anon" on contas_receber_manuais;
create policy "allow_all_anon" on contas_receber_manuais for all using (true) with check (true);
