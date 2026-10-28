-- Migration 020: "Operador adicional" no serviço (segundo operador que executa junto; aparece na OS).
-- Rode no SQL Editor do Supabase ANTES de usar o campo (o app só envia a coluna quando ela é usada).

alter table servicos add column if not exists operador_adicional text;
