-- Migration 013: e-mail e fim do contrato deixam de ser obrigatórios no cadastro do cliente.
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

alter table clientes
  alter column email drop not null,
  alter column contrato_fim drop not null;
