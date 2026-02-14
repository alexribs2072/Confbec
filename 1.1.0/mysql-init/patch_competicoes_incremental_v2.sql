-- Patch incremental: módulo de competições + ajustes pagamentos (MySQL)
-- Compatível com o init.sql atual (timestamps createdAt/updatedAt)

START TRANSACTION;

-- 1) Atletas: campo sexo (Art. 08)
ALTER TABLE atletas
  ADD COLUMN sexo ENUM('M','F') NULL AFTER telefone_contato;

-- 2) Pagamentos: permitir pagamentos sem filiação (competição) + vínculo opcional
ALTER TABLE pagamentos
  MODIFY COLUMN filiacao_id INT NULL;

ALTER TABLE pagamentos
  ADD COLUMN competicao_inscricao_id INT NULL AFTER filiacao_id;

-- 3) Tabelas do módulo de competições
CREATE TABLE IF NOT EXISTS competicao_eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  descricao TEXT NULL,
  local VARCHAR(200) NULL,
  escopo ENUM('MUNICIPAL','ESTADUAL','NACIONAL','INTERNACIONAL') NOT NULL DEFAULT 'MUNICIPAL',
  data_evento DATETIME NOT NULL,
  data_fim DATETIME NULL,
  status ENUM('RASCUNHO','INSCRICOES_ABERTAS','INSCRICOES_ENCERRADAS','EM_ANDAMENTO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
  taxa_inscricao DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS competicao_modalidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  tipo ENUM('TROCACAO','GRAPPLING','MISTO') NOT NULL,
  filiacao_modalidade_id INT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_comp_mod_filiacao_modalidade
    FOREIGN KEY (filiacao_modalidade_id) REFERENCES modalidades(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS competicao_evento_modalidades (
  evento_id INT NOT NULL,
  competicao_modalidade_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (evento_id, competicao_modalidade_id),
  CONSTRAINT fk_comp_ev_mod_evento FOREIGN KEY (evento_id) REFERENCES competicao_eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_ev_mod_mod FOREIGN KEY (competicao_modalidade_id) REFERENCES competicao_modalidades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS competicao_inscricoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  atleta_id INT NOT NULL,
  filiacao_id INT NOT NULL,
  competicao_modalidade_id INT NOT NULL,
  peso_kg DECIMAL(5,2) NOT NULL,
  idade_anos INT NOT NULL,
  grupo_etario ENUM('KADETE','JUVENIL','ADULTO','MASTER','MASTER2') NOT NULL,
  divisao_idade VARCHAR(20) NULL,
  divisao_peso VARCHAR(20) NOT NULL,
  categoria_combate ENUM('COLORIDAS','AVANCADA') NOT NULL,
  status ENUM('PENDENTE_PAGAMENTO','AGUARDANDO_AUTORIZACAO','CONFIRMADA','BLOQUEADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE_PAGAMENTO',
  motivo_bloqueio VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_comp_inscricao (evento_id, atleta_id, competicao_modalidade_id),
  CONSTRAINT fk_comp_insc_evento FOREIGN KEY (evento_id) REFERENCES competicao_eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_insc_atleta FOREIGN KEY (atleta_id) REFERENCES atletas(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_insc_filiacao FOREIGN KEY (filiacao_id) REFERENCES filiacoes(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_insc_mod FOREIGN KEY (competicao_modalidade_id) REFERENCES competicao_modalidades(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS competicao_autorizacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  atleta_id INT NOT NULL,
  authority ENUM('FEDERACAO_ESTADUAL','CONFBEC') NOT NULL,
  status ENUM('PENDENTE','APROVADA','NEGADA') NOT NULL DEFAULT 'PENDENTE',
  requested_at DATETIME NOT NULL,
  approved_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_comp_aut_evento FOREIGN KEY (evento_id) REFERENCES competicao_eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_aut_atleta FOREIGN KEY (atleta_id) REFERENCES atletas(id) ON DELETE CASCADE
);

-- 4) FK pagamentos -> inscrições
ALTER TABLE pagamentos
  ADD CONSTRAINT fk_pag_comp_insc
  FOREIGN KEY (competicao_inscricao_id) REFERENCES competicao_inscricoes(id)
  ON DELETE SET NULL;

-- 5) Seeds (modalidades de competição baseadas no regulamento)
INSERT INTO competicao_modalidades (code, nome, tipo, ativo, created_at, updated_at)
VALUES
  ('POINT_FIGHT','Point Fight','TROCACAO',1,NOW(),NOW()),
  ('KB_SEMI','Kickboxing Semi Contato','TROCACAO',1,NOW(),NOW()),
  ('KB_LIGHT','Kickboxing Light Contact','TROCACAO',1,NOW(),NOW()),
  ('K1_LIGHT','K1 Light','TROCACAO',1,NOW(),NOW()),
  ('BRAZILIAN_GRAPPLING','Brazilian Grappling','GRAPPLING',1,NOW(),NOW())
ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at);

COMMIT;
