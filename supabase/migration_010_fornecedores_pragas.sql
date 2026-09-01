-- Migration 010: fornecedores, tipos de praga editáveis, vínculo fornecedor <-> contas a pagar.
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_prestacao_servico text not null default '',
  cnpj text,
  cpf text,
  email text,
  telefone text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists tipos_praga (
  id uuid primary key default gen_random_uuid(),
  nome text not null
);

alter table contas_pagar
  add column if not exists fornecedor_id uuid references fornecedores(id) on delete set null;

alter table fornecedores enable row level security;
alter table tipos_praga enable row level security;

drop policy if exists "allow_all_anon" on fornecedores;
create policy "allow_all_anon" on fornecedores for all using (true) with check (true);

drop policy if exists "allow_all_anon" on tipos_praga;
create policy "allow_all_anon" on tipos_praga for all using (true) with check (true);

insert into tipos_praga (nome)
select * from (values
  ('Baratas'), ('Cupins'), ('Ratos/Roedores'), ('Escorpiões'), ('Pombos'),
  ('Formigas'), ('Percevejos'), ('Mosquitos'), ('Aranhas'), ('Carrapatos/Pulgas')
) as v(nome)
where not exists (select 1 from tipos_praga);
