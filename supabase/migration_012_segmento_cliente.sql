-- Migration 012: segmentação do cliente por periodicidade (Mensal/Trimestral/Semestral/Anual).
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

alter table clientes
  add column if not exists segmento text;
