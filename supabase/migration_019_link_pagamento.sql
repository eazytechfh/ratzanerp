-- Migration 019: "Link de pagamento" como forma de cobrar o cartão (em vez da maquininha).
-- Rode no SQL Editor do Supabase ANTES de usar a opção (o app só envia a coluna quando ela é usada).

alter table servicos add column if not exists link_pagamento boolean;
