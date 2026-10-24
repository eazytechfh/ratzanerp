-- Migration 018: "Operador da Ocorrência" nos serviços por garantia/reforço.
-- Rode no SQL Editor do Supabase ANTES de usar o campo (o app só envia a coluna quando preenchida).
--
-- Guarda quem executou o serviço original: o reforço conta na bonificação dele,
-- e não na de quem faz o reforço. Não aparece na OS.

alter table servicos add column if not exists operador_ocorrencia text;
