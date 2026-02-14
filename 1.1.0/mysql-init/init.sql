-- Garante que estamos usando o banco de dados correto (o nome vem do .env)
-- USE confbec_db; -- O Docker geralmente faz isso, mas pode adicionar se necessário

-- Criação da Tabela USUARIOS
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` INTEGER NOT NULL auto_increment,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `senha` VARCHAR(255) NOT NULL,
    `tipo` ENUM('atleta', 'professor', 'treinador', 'admin') NOT NULL DEFAULT 'atleta',
    `nome` VARCHAR(255) NULL, -- Coluna adicionada
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela FEDERACOES
CREATE TABLE IF NOT EXISTS `federacoes` (
    `id` INTEGER NOT NULL auto_increment,
    `nome` VARCHAR(255) NOT NULL,
    `cnpj` VARCHAR(255) UNIQUE,
    `logradouro` VARCHAR(255), `cep` VARCHAR(20), `bairro` VARCHAR(255), `cidade` VARCHAR(255), `estado` VARCHAR(2),
    `telefone` VARCHAR(20), `email` VARCHAR(255),
    `representante_id` INTEGER,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`representante_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela ACADEMIAS
CREATE TABLE IF NOT EXISTS `academias` (
    `id` INTEGER NOT NULL auto_increment,
    `nome` VARCHAR(255) NOT NULL,
    `cnpj` VARCHAR(255) UNIQUE,
    `logradouro` VARCHAR(255), `cep` VARCHAR(20), `bairro` VARCHAR(255), `cidade` VARCHAR(255), `estado` VARCHAR(2),
    `telefone` VARCHAR(20), `email` VARCHAR(255),
    `federacao_id` INTEGER,
    `responsavel_id` INTEGER,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`federacao_id`) REFERENCES `federacoes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela ATLETAS
CREATE TABLE IF NOT EXISTS `atletas` (
    `id` INTEGER NOT NULL, -- PK e FK
    `nome_completo` VARCHAR(255) NOT NULL,
    `data_nascimento` DATE NOT NULL,
    `rg` VARCHAR(50), `cpf` VARCHAR(20) NOT NULL UNIQUE,
    `logradouro` VARCHAR(255), `cep` VARCHAR(20), `bairro` VARCHAR(255), `cidade` VARCHAR(255), `estado` VARCHAR(2),
    `telefone_contato` VARCHAR(20),
    `foto_url` VARCHAR(1024) NULL, -- Coluna adicionada
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela MODALIDADES
CREATE TABLE IF NOT EXISTS `modalidades` (
    `id` INTEGER NOT NULL auto_increment,
    `nome` VARCHAR(255) NOT NULL UNIQUE,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela GRADUACOES
CREATE TABLE IF NOT EXISTS `graduacoes` (
    `id` INTEGER NOT NULL auto_increment,
    `nome` VARCHAR(255) NOT NULL,
    `restricao_idade` VARCHAR(100),
    `ordem` INTEGER DEFAULT 0,
    `modalidade_id` INTEGER NOT NULL,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`modalidade_id`) REFERENCES `modalidades` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela FILIACOES (Com ENUM atualizado)
CREATE TABLE IF NOT EXISTS `filiacoes` (
    `id` INTEGER NOT NULL auto_increment,
    `atleta_id` INTEGER NOT NULL, `academia_id` INTEGER NOT NULL, `modalidade_id` INTEGER NOT NULL, `graduacao_id` INTEGER NOT NULL,
    `professor_id` INTEGER,
    `status` ENUM('pendente_documentos', 'pendente_aprovacao_docs', 'pendente_aprovacao_professor', 'pendente_pagamento', 'ativo', 'rejeitado', 'inativo') NOT NULL DEFAULT 'pendente_documentos',
    `data_solicitacao` DATE NOT NULL,
    `data_aprovacao` DATE, `data_vencimento` DATE,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`academia_id`) REFERENCES `academias` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`modalidade_id`) REFERENCES `modalidades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`graduacao_id`) REFERENCES `graduacoes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`professor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela DOCUMENTOS (Com nome_original)
CREATE TABLE IF NOT EXISTS `documentos` (
    `id` INTEGER NOT NULL auto_increment,
    `filiacao_id` INTEGER NOT NULL,
    `tipo_documento` ENUM('atestado_medico', 'certificado_graduacao', 'rg_frente', 'rg_verso', 'comprovante_residencia', 'outro') NOT NULL,
    `url_arquivo` VARCHAR(1024) NOT NULL,
    `nome_original` VARCHAR(255) NOT NULL, -- Coluna adicionada
    `status` ENUM('pendente', 'aprovado', 'rejeitado') NOT NULL DEFAULT 'pendente',
    `data_upload` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Ajustado default
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`filiacao_id`) REFERENCES `filiacoes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela METODO_PAGAMENTOS
CREATE TABLE IF NOT EXISTS `metodo_pagamentos` (
    `id` INTEGER NOT NULL auto_increment,
    `nome` VARCHAR(100) NOT NULL,
    `taxa_filiacao` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `configuracao` JSON,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela PAGAMENTOS
CREATE TABLE IF NOT EXISTS `pagamentos` (
    `id` INTEGER NOT NULL auto_increment,
    `filiacao_id` INTEGER NOT NULL,
    `metodo_pagamento_id` INTEGER,
    `valor_pago` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pendente', 'pago', 'falhou', 'reembolsado') NOT NULL DEFAULT 'pendente',
    `id_transacao_gateway` VARCHAR(255) UNIQUE,
    `data_pagamento` DATETIME,
    `qr_code_pix` TEXT,
    `linha_digitavel_boleto` TEXT,
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`filiacao_id`) REFERENCES `filiacoes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`metodo_pagamento_id`) REFERENCES `metodo_pagamentos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criação da Tabela NOTICIAS
CREATE TABLE IF NOT EXISTS `noticias` (
    `id` INTEGER NOT NULL auto_increment,
    `titulo` VARCHAR(255) NOT NULL,
    `subtitulo` TEXT, `conteudo` TEXT NOT NULL,
    `imagem_url` VARCHAR(1024),
    `autor_id` INTEGER,
    `publicada_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Ajustado default
    `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --- INSERÇÃO DO USUÁRIO ADMIN ---
-- Insere apenas se o email não existir ainda
INSERT INTO usuarios (email, senha, tipo, nome, createdAt, updatedAt)
SELECT * FROM (SELECT 'confbecadmin@gmail.com' AS email, '$2b$10$UnZ/iNttyZSMSYv3hatHhua0VbGk.PsqJnW9VWXg/MOk/DZDrjV.y' AS senha, 'admin' AS tipo, 'Administrador CONFBEC' AS nome, NOW() as ca, NOW() as ua) AS temp
WHERE NOT EXISTS (
    SELECT email FROM usuarios WHERE email = 'confbecadmin@gmail.com'
) LIMIT 1;

INSERT INTO usuarios (email, senha, tipo, nome, createdAt, updatedAt)
SELECT * FROM (SELECT 'carlos@maiolino.com' AS email, '$2b$10$9uYNrKaU1dl/tRMNCNOAY.WU8N7bFSQ74nmpfaYpEk3CMLRy.HC1m' AS senha, 'professor' AS tipo, 'Carlos Alberto Maiolino' AS nome, NOW() as ca, NOW() as ua) AS temp
WHERE NOT EXISTS (
    SELECT email FROM usuarios WHERE email = 'carlos@maiolino.com'
) LIMIT 1;

-- --- INSERÇÃO DE DADOS PADRÃO ---
-- 2. Modalidades

INSERT IGNORE INTO modalidades (id, nome, createdAt, updatedAt)
VALUES
    (1, 'Jiu-Jitsu', NOW(), NOW()),
    (2, 'Grappling', NOW(), NOW()),
    (3, 'Kickboxing', NOW(), NOW()),
    (4, 'Muay Thai', NOW(), NOW()),
    (5, 'Boxe', NOW(), NOW()),
    (6, 'MMA', NOW(), NOW());

-- 6. Graduações
-- Usamos INSERT IGNORE para evitar erros se o script rodar mais de uma vez
-- IDs das modalidades (1=Jiu-Jitsu, 2=Grappling, 3=Kickboxing, 4=Muay Thai, 5=Boxe, 6=MMA)
-- Jiu-Jitsu (ID 1)
INSERT INTO graduacoes (nome, restricao_idade, ordem, modalidade_id, createdAt, updatedAt) VALUES
('Faixa Branca' , 0, 1, 1, NOW(), NOW()),
('Faixa Cinza'  , 7, 2, 1, NOW(), NOW()),
('Faixa Amarela', 7, 3, 1, NOW(), NOW()),
('Faixa Laranja', 10, 4, 1, NOW(), NOW()),
('Faixa Verde'  , 13, 5, 1, NOW(), NOW()),
('Faixa Azul'   , 16, 6, 1, NOW(), NOW()),
('Faixa Roxa'   , 16, 7, 1, NOW(), NOW()),
('Faixa Marrom' , 18, 8, 1, NOW(), NOW()),
('Faixa Preta'  , 19, 9, 1, NOW(), NOW());

-- Grappling (ID 2)
INSERT INTO graduacoes (nome, restricao_idade, ordem, modalidade_id, createdAt, updatedAt) VALUES
('Faixa Branca' , 0, 1, 2, NOW(), NOW()),
('Faixa Cinza'  , 7, 2, 2, NOW(), NOW()),
('Faixa Amarela', 7, 3, 2, NOW(), NOW()),
('Faixa Laranja', 10, 4, 2, NOW(), NOW()),
('Faixa Verde'  , 13, 5, 2, NOW(), NOW()),
('Faixa Azul'   , 16, 6, 2, NOW(), NOW()),
('Faixa Roxa'   , 16, 7, 2, NOW(), NOW()),
('Faixa Marrom' , 18, 8, 2, NOW(), NOW()),
('Faixa Preta'  , 19, 9, 2, NOW(), NOW());

-- Kickboxing (ID 3)
INSERT INTO graduacoes (nome, restricao_idade, ordem, modalidade_id, createdAt, updatedAt) VALUES
('Faixa Branca' , 0, 1, 3, NOW(), NOW()),
('Faixa Amarela', 7, 2, 3, NOW(), NOW()),
('Faixa Laranja', 10, 3, 3, NOW(), NOW()),
('Faixa Verde'  , 13, 4, 3, NOW(), NOW()),
('Faixa Azul'   , 16, 5, 3, NOW(), NOW()),
('Faixa Marrom' , 18, 6, 3, NOW(), NOW()),
('Faixa Preta'  , 19, 7, 3, NOW(), NOW());

-- Muay Thai (ID 4)
INSERT IGNORE INTO graduacoes (nome, restricao_idade, ordem, modalidade_id, createdAt, updatedAt)
VALUES
    ('Branca Vermelha (1º Khan)'        , NULL, 1, 4, NOW(), NOW()),
    ('Vermelho (2º Khan)'               , NULL, 2, 4, NOW(), NOW()),
    ('Vermelho Azul Claro (3º Khan)'    , NULL, 3, 4, NOW(), NOW()),
    ('Azul Claro (4º Khan)'             , NULL, 4, 4, NOW(), NOW()),
    ('Azul Claro Azul Escuro (5º Khan)' , NULL, 5, 4, NOW(), NOW()),
    ('Azul Escuro (6º Khan)'            , NULL, 6, 4, NOW(), NOW()),
    ('Azul Escuro Preta (7º Khan)'      , NULL, 7, 4, NOW(), NOW()),
    ('Preto (8º Khan)'                  , NULL, 8, 4, NOW(), NOW());

-- Boxe (ID 5)
INSERT INTO graduacoes (nome, restricao_idade, ordem, modalidade_id, createdAt, updatedAt) VALUES
('Amador'        , 0, 1, 5, NOW(), NOW()),
('Profissional'  , 0, 2, 5, NOW(), NOW());

-- MMA (ID 6)
INSERT INTO graduacoes (nome, restricao_idade, ordem, modalidade_id, createdAt, updatedAt) VALUES
('Faixa Branca' , 0, 1, 6, NOW(), NOW()),
('Faixa Cinza'  , 7, 2, 6, NOW(), NOW()),
('Faixa Amarela', 7, 3, 6, NOW(), NOW()),
('Faixa Laranja', 10, 4, 6, NOW(), NOW()),
('Faixa Verde'  , 13, 5, 6, NOW(), NOW()),
('Faixa Azul'   , 16, 6, 6, NOW(), NOW()),
('Faixa Roxa'   , 16, 7, 6, NOW(), NOW()),
('Faixa Marrom' , 18, 8, 6, NOW(), NOW()),
('Faixa Preta'  , 19, 9, 6, NOW(), NOW());


-- Você pode adicionar inserções para modalidades padrão aqui, se desejar
-- INSERT INTO modalidades (nome, createdAt, updatedAt) VALUES ('Jiu-Jitsu', NOW(), NOW()), ('Kickboxing', NOW(), NOW()), ('Muay Thai', NOW(), NOW());