-- Migration 003: integração Asaas (mapeamento de clientes + cobranças emitidas)
-- Rode no SQL Editor do Supabase (depois das migrations 001/002).

create table if not exists asaas_clientes (
  cliente_id uuid primary key references clientes(id) on delete cascade,
  asaas_customer_id text not null,
  criado_em timestamptz not null default now()
);

create table if not exists cobrancas_asaas (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  cliente_id uuid references clientes(id) on delete cascade,
  tipo text not null check (tipo in ('boleto', 'nf')),
  asaas_id text,
  status text,
  url text,
  valor numeric(12,2),
  erro text,
  criado_em timestamptz not null default now()
);

create index if not exists cobrancas_asaas_item_id_idx on cobrancas_asaas(item_id);
create index if not exists cobrancas_asaas_cliente_id_idx on cobrancas_asaas(cliente_id);

create table if not exists integracoes_config (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb
);

alter table asaas_clientes enable row level security;
alter table cobrancas_asaas enable row level security;
alter table integracoes_config enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['asaas_clientes', 'cobrancas_asaas', 'integracoes_config'])
  loop
    execute format('drop policy if exists "allow_all_anon" on %I;', t);
    execute format('create policy "allow_all_anon" on %I for all using (true) with check (true);', t);
  end loop;
end $$;

insert into integracoes_config (chave, valor)
values ('asaas', '{"ambiente": "sandbox"}'::jsonb)
on conflict (chave) do nothing;
