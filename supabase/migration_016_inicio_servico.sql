-- Migration 016: início do serviço com foto da fachada, atraso e histórico do serviço.
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).
--
-- Só cria tabelas novas — não altera nada em tabelas existentes, então é seguro rodar
-- antes ou depois do deploy do app (o app trata a ausência dessas tabelas sem quebrar).

-- Histórico do serviço: início, justificativa de atraso etc. (texto leve, carrega junto
-- com a Agenda). Some junto com o serviço se ele for excluído.
create table if not exists servico_eventos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  tipo text not null check (tipo in ('inicio', 'atraso_justificado')),
  detalhe text not null default '',
  usuario text not null default '',
  criado_em timestamptz not null default now()
);

create index if not exists servico_eventos_servico_idx on servico_eventos(servico_id);

-- Foto da fachada tirada ao iniciar o serviço. Fica em tabela separada (a imagem é
-- pesada e não deve vir junto com a lista de serviços) e só é guardada por 7 dias.
create table if not exists fotos_servico (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  imagem text not null,            -- data URL (JPEG comprimido no celular, ~100 KB)
  criada_em timestamptz not null default now()
);

create index if not exists fotos_servico_servico_idx on fotos_servico(servico_id);
create index if not exists fotos_servico_criada_idx on fotos_servico(criada_em);

-- RLS: só usuários logados (diferente das tabelas antigas, que ainda estão abertas à anon key).
alter table servico_eventos enable row level security;
alter table fotos_servico enable row level security;

drop policy if exists "servico_eventos_authenticated" on servico_eventos;
create policy "servico_eventos_authenticated" on servico_eventos
  for all to authenticated using (true) with check (true);

drop policy if exists "fotos_servico_authenticated" on fotos_servico;
create policy "fotos_servico_authenticated" on fotos_servico
  for all to authenticated using (true) with check (true);

-- Limpeza das fotos com mais de 7 dias. O app já apaga ao abrir a Agenda; o agendamento
-- abaixo é OPCIONAL (exige habilitar a extensão pg_cron em Database > Extensions) e garante
-- a limpeza mesmo se ninguém abrir o sistema:
--
-- select cron.schedule('limpar-fotos-servico', '0 3 * * *',
--   $$ delete from fotos_servico where criada_em < now() - interval '7 days' $$);
