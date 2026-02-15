-- Patch incremental v3: adicionar modalidade Boxe Clássico/Amador ao módulo de competições
-- (opcional, mas recomendado para habilitar as regras de rounds/duração por categoria)

START TRANSACTION;

INSERT INTO competicao_modalidades (code, nome, tipo, filiacao_modalidade_id, ativo, created_at, updated_at)
VALUES (
  'BOXE_CLASSICO_AMADOR',
  'Boxe Clássico/Amador',
  'TROCACAO',
  (SELECT id FROM modalidades WHERE nome = 'Boxe' LIMIT 1),
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  tipo = VALUES(tipo),
  filiacao_modalidade_id = VALUES(filiacao_modalidade_id),
  ativo = VALUES(ativo),
  updated_at = VALUES(updated_at);

COMMIT;
