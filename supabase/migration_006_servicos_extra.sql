-- Migration 006: garantia definida na criação do serviço + hora real de início.
-- (A forma de pagamento "Incluso no Contrato" não precisa de migration:
-- a coluna forma_pagamento já é texto livre, sem constraint de valores.)
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

alter table servicos
  add column if not exists garantia_ate date,
  add column if not exists hora_inicio_real text;
