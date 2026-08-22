-- Migration 005: perfis de usuário (login real + papéis)
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).
-- A criação de usuários (auth + perfil) é feita pela Edge Function "criar-usuario",
-- nunca diretamente pelo app — por isso não há política de insert/update/delete aqui,
-- só a Service Role (usada dentro da function) pode escrever.

create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null check (role in ('operador', 'gerente_operacional', 'gerente_geral', 'administrador')),
  operador_id uuid references operadores(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists perfis_operador_id_idx on perfis(operador_id);

alter table perfis enable row level security;

drop policy if exists "perfis_select_authenticated" on perfis;
create policy "perfis_select_authenticated" on perfis for select using (auth.role() = 'authenticated');
