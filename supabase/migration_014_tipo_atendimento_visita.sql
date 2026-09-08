-- Migration 014: permite tipo_atendimento = 'visita' (cadastro de visita no cliente).
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).

alter table servicos
  drop constraint if exists servicos_tipo_atendimento_check;

alter table servicos
  add constraint servicos_tipo_atendimento_check check (tipo_atendimento in ('novo', 'reforco', 'visita'));
