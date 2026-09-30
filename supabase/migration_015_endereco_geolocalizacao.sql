-- Migration 015: geolocalização de endereços (mapa no cadastro do cliente).
-- Rode no SQL Editor do Supabase (depois das migrations anteriores).
--
-- O pino confirmado no mapa (lat/lng) de cada endereço do cliente já é salvo dentro
-- da própria coluna jsonb `clientes.enderecos` (não precisa de migration pra isso).
-- Aqui só adicionamos onde guardar a coordenada copiada para o serviço agendado, usada
-- pela Agenda para abrir a rota exata (em vez de depender do Google adivinhar o
-- endereço só pelo texto, que é a causa de cair na rua errada em bairros diferentes).

alter table servicos add column if not exists endereco_lat numeric;
alter table servicos add column if not exists endereco_lng numeric;
