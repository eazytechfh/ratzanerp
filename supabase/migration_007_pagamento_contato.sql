-- Migration 007: contato do responsável (PJ), maquininha de cartão e detalhamento de parcelas do boleto.
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

alter table clientes
  add column if not exists contato_responsavel text;

alter table servicos
  add column if not exists maquininha text,
  add column if not exists parcelas_detalhe jsonb;
