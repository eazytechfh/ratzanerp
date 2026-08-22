-- Migration 004: metas internas (reserva, participação de lucros etc.) para a aba Previsibilidade
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

create table if not exists metas_internas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  percentual numeric(5,2) not null,
  criado_em timestamptz not null default now()
);

alter table metas_internas enable row level security;

drop policy if exists "allow_all_anon" on metas_internas;
create policy "allow_all_anon" on metas_internas for all using (true) with check (true);

insert into metas_internas (nome, percentual)
select * from (values
  ('Reserva', 30::numeric),
  ('Participação dos lucros da equipe', 10::numeric),
  ('Parceiro de Negócios', 5::numeric)
) as v(nome, percentual)
where not exists (select 1 from metas_internas);
