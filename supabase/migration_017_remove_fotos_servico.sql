-- Migration 017: remove a foto da fachada do início do serviço.
-- Rode no SQL Editor do Supabase.
--
-- As fotos eram guardadas no próprio banco (tabela fotos_servico) e acabaram ocupando o
-- espaço do plano, o que impedia iniciar novos serviços. O recurso foi retirado do sistema.
-- O histórico do serviço (início e justificativas de atraso) continua existindo.

-- Se o banco estiver em modo somente leitura por falta de espaço, libera a escrita nesta sessão.
-- (Rode tudo junto, numa única execução, para valer para os comandos seguintes.)
set default_transaction_read_only = 'off';

-- 1) Apaga todas as fotos e devolve o espaço em disco na hora.
--    TRUNCATE libera o espaço imediatamente; um DELETE comum não.
truncate table fotos_servico;

-- 2) Remove a tabela, que não é mais usada.
drop table if exists fotos_servico;

-- 3) (Opcional) Tira a menção à foto dos registros antigos do histórico dos serviços.
update servico_eventos
set detalhe = replace(replace(detalhe, ' (foto da fachada registrada)', ''), ' (sem foto da fachada)', '')
where detalhe like '%foto da fachada%';
