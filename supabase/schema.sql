-- Ratzan ERP — schema inicial
-- Rode este arquivo inteiro no SQL Editor do Supabase (Project > SQL Editor > New query).
-- RLS está habilitado em todas as tabelas com uma política permissiva temporária
-- (liberado para a chave anon), já que o login ainda não usa Supabase Auth.
-- Quando migrarmos para Supabase Auth, essas políticas devem ser trocadas por
-- regras baseadas em auth.uid() / auth.role().

create extension if not exists pgcrypto;

-- ========== CATEGORIAS DE CLIENTE ==========
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text not null
);

-- ========== TIPOS DE SERVIÇO ==========
create table if not exists tipos_servico (
  id uuid primary key default gen_random_uuid(),
  nome text not null
);

-- ========== OPERADORES (EQUIPE) ==========
create table if not exists operadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  endereco text,
  cargo text
);

-- ========== CLIENTES ==========
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('PF','PJ')),
  nome text not null,
  cpf text,
  cnpj text,
  email text not null,
  telefone text not null,
  bairro text not null default '',
  categoria_id uuid references categorias(id) on delete set null,
  enderecos jsonb not null default '[]'::jsonb,
  status text not null check (status in ('ativo','inativo','vencendo','vencido')),
  data_cadastro date not null default current_date,
  contrato_inicio date not null,
  contrato_fim date not null,
  recorrente boolean not null default false,
  possui_pet boolean not null default false,
  precisa_epi boolean not null default false,
  origem text not null default 'Outro',
  observacoes text,
  created_at timestamptz not null default now()
);

-- ========== SERVIÇOS ==========
create table if not exists servicos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  cliente_nome text not null,
  tipo_servico text not null,
  operador text not null,
  data_agendada date not null,
  hora_agendada text not null,
  status text not null check (status in ('agendado','em_andamento','concluido','cancelado')),
  endereco text,
  observacoes text,
  valor numeric(12,2) not null default 0,
  tipo_atendimento text not null check (tipo_atendimento in ('novo','reforco')),
  pragas text[] not null default '{}',
  forma_pagamento text not null,
  parcelas int,
  contabilizar_receita boolean not null default true,
  baixa jsonb,
  created_at timestamptz not null default now()
);

create index if not exists servicos_cliente_id_idx on servicos(cliente_id);
create index if not exists servicos_data_agendada_idx on servicos(data_agendada);

-- ========== CONTRATOS ==========
create table if not exists contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  contratante_nome text,
  contratante_documento text,
  contratante_endereco text,
  contratante_email text,
  servicos_abrangidos text,
  reajuste_percentual numeric default 0,
  periodicidade text,
  reforco_programado text,
  valor_total numeric(12,2) default 0,
  forma_pagamento text,
  parcelado boolean default false,
  qtd_parcelas int,
  valor_parcela numeric(12,2),
  vencimentos text,
  data_inicio date,
  data_fim date,
  data_assinatura date,
  responsavel_contratante text,
  representante_ratzan text,
  criado_em date default current_date
);

create index if not exists contratos_cliente_id_idx on contratos(cliente_id);

-- ========== ALERTAS / TAREFAS ==========
create table if not exists alertas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  cliente_nome text,
  texto text not null,
  prioridade text not null check (prioridade in ('baixa','media','alta')) default 'media',
  concluido boolean not null default false,
  criado_por text,
  criado_em timestamptz not null default now()
);

create index if not exists alertas_cliente_id_idx on alertas(cliente_id);

-- ========== LOGS DO SISTEMA ==========
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  usuario text,
  acao text,
  detalhes text,
  data timestamptz not null default now()
);

create index if not exists logs_data_idx on logs(data desc);

-- ========== CONTAS A PAGAR ==========
create table if not exists contas_pagar (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text,
  valor numeric(12,2) not null default 0,
  vencimento date not null,
  status text not null check (status in ('pendente','pago','cancelado')) default 'pendente',
  data_pagamento date
);

-- ========== METAS MENSAIS ==========
create table if not exists metas (
  ano int not null,
  mes int not null,
  valor numeric(12,2) not null default 0,
  primary key (ano, mes)
);

-- ========== BAIXAS DE CONTAS A RECEBER (computadas no app, marcadas aqui) ==========
create table if not exists recebimentos_baixados (
  item_id text primary key,
  baixado_em timestamptz not null default now()
);

-- ================= RLS =================
alter table categorias enable row level security;
alter table tipos_servico enable row level security;
alter table operadores enable row level security;
alter table clientes enable row level security;
alter table servicos enable row level security;
alter table contratos enable row level security;
alter table alertas enable row level security;
alter table logs enable row level security;
alter table contas_pagar enable row level security;
alter table metas enable row level security;
alter table recebimentos_baixados enable row level security;

-- Política temporária: libera tudo para a chave anon (sem Supabase Auth ainda).
-- IMPORTANTE: trocar por políticas restritas quando o login real for implementado.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'categorias','tipos_servico','operadores','clientes','servicos',
    'contratos','alertas','logs','contas_pagar','metas','recebimentos_baixados'
  ])
  loop
    execute format('drop policy if exists "allow_all_anon" on %I;', t);
    execute format(
      'create policy "allow_all_anon" on %I for all using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ================= DADOS INICIAIS (idempotente) =================
insert into categorias (nome, cor)
select * from (values
  ('Residencial', '#cc3366'),
  ('Comercial', '#ab171a'),
  ('Industrial', '#062233'),
  ('Condomínio', '#0ea5e9'),
  ('Saúde/Hospitalar', '#16a34a')
) as v(nome, cor)
where not exists (select 1 from categorias);

insert into tipos_servico (nome)
select * from (values
  ('Dedetização Geral'), ('Controle de Cupins'), ('Desratização'), ('Controle de Escorpiões'),
  ('Descupinização Preventiva'), ('Controle de Pombos'), ('Sanitização'), ('Controle de Baratas')
) as v(nome)
where not exists (select 1 from tipos_servico);

insert into operadores (nome, telefone, endereco, cargo)
select * from (values
  ('Marcos Vinícius', '(21) 98811-2233', 'Rua Tijuca, 120, Rio de Janeiro/RJ', 'Técnico Aplicador'),
  ('Renata Alves', '(21) 97722-3344', 'Rua Botafogo, 55, Rio de Janeiro/RJ', 'Técnica Aplicadora'),
  ('Diego Fernandes', '(21) 96633-4455', 'Rua Méier, 300, Rio de Janeiro/RJ', 'Supervisor de Campo'),
  ('Patrícia Nogueira', '(21) 95544-5566', 'Rua Ipanema, 88, Rio de Janeiro/RJ', 'Técnica Aplicadora'),
  ('Anderson Reis', '(21) 94455-6677', 'Rua Recreio, 410, Rio de Janeiro/RJ', 'Técnico Aplicador')
) as v(nome, telefone, endereco, cargo)
where not exists (select 1 from operadores);

insert into metas (ano, mes, valor)
select extract(year from current_date)::int, m, 18000
from generate_series(1, 12) as m
where not exists (select 1 from metas where ano = extract(year from current_date)::int);

insert into contas_pagar (descricao, categoria, valor, vencimento, status, data_pagamento)
select * from (values
  ('Aluguel do galpão', 'Infraestrutura', 4200::numeric, current_date + 3, 'pendente', null::date),
  ('Compra de insumos químicos', 'Insumos', 3150::numeric, current_date + 6, 'pendente', null::date),
  ('Folha de pagamento', 'Pessoal', 15800::numeric, current_date + 10, 'pendente', null::date),
  ('Combustível frota', 'Frota', 980::numeric, current_date - 2, 'pago', current_date - 2),
  ('Manutenção de equipamentos', 'Manutenção', 640::numeric, current_date - 8, 'pago', current_date - 8),
  ('Marketing/Anúncios', 'Marketing', 1200::numeric, current_date + 15, 'pendente', null::date)
) as v(descricao, categoria, valor, vencimento, status, data_pagamento)
where not exists (select 1 from contas_pagar);
