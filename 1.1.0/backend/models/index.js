'use strict';

const sequelize = require('../config/connection'); // Corrigido para 'connection.js'
const { Sequelize } = require('sequelize');

// Objeto 'db' que irá guardar nossos modelos
const db = {};

// 1. Importa os modelos
db.Usuario = require('./Usuario.js');
db.Federacao = require('./Federacao.js');
db.Academia = require('./Academia.js');
db.Atleta = require('./Atleta.js'); 
db.Modalidade = require('./Modalidade.js');
db.Graduacao = require('./Graduacao.js');
db.Filiacao = require('./Filiacao.js');
db.Documento = require('./Documento.js');
db.MetodoPagamento = require('./MetodoPagamento.js');
db.Pagamento = require('./Pagamento.js');
db.Noticia = require('./Noticia.js');

// --- Módulo de Competições ---
db.CompeticaoEvento = require('./CompeticaoEvento.js');
db.CompeticaoModalidade = require('./CompeticaoModalidade.js');
db.CompeticaoEventoModalidade = require('./CompeticaoEventoModalidade.js');
db.CompeticaoInscricao = require('./CompeticaoInscricao.js');
db.CompeticaoAutorizacao = require('./CompeticaoAutorizacao.js');

// --- (Você irá criar estes arquivos em breve) ---
// db.Modalidade = require('./Modalidade.js');
// db.Graduacao = require('./Graduacao.js');
// db.Filiacao = require('./Filiacao.js');
// db.Documento = require('./Documento.js');
// db.MetodoPagamento = require('./MetodoPagamento.js');
// db.Pagamento = require('./Pagamento.js');
// db.Noticia = require('./Noticia.js');


// --- DEFINIÇÃO DAS ASSOCIAÇÕES (RELACIONAMENTOS) ---

// 1. Relação Usuario (Representante) <-> Federacao
// Um Usuário (Representante) pode gerenciar UMA Federação
db.Usuario.hasOne(db.Federacao, {
    foreignKey: 'representante_id',
    as: 'federacaoRepresentada' // Apelido para a relação
});
// Uma Federação pertence a UM Usuário (Representante)
db.Federacao.belongsTo(db.Usuario, {
    foreignKey: 'representante_id',
    as: 'representante' // Apelido
});


// 2. Relação Usuario (Responsável) <-> Academia
// Um Usuário (Responsável) pode gerenciar UMA Academia
db.Usuario.hasOne(db.Academia, {
    foreignKey: 'responsavel_id',
    as: 'academiaResponsavel'
});
// Uma Academia pertence a UM Usuário (Responsável)
db.Academia.belongsTo(db.Usuario, {
    foreignKey: 'responsavel_id',
    as: 'responsavel'
});


// 3. Relação Federacao <-> Academia
// Uma Federação pode ter VÁRIAS Academias
db.Federacao.hasMany(db.Academia, {
    foreignKey: 'federacao_id',
    as: 'academias'
});
// Uma Academia pertence a UMA Federação
db.Academia.belongsTo(db.Federacao, {
    foreignKey: 'federacao_id',
    as: 'federacao'
});


// 4. Relação Usuario <-> Atleta (1-para-1) (NOVO)
// Um Usuário (do tipo atleta) tem UM perfil de Atleta
db.Usuario.hasOne(db.Atleta, {
    foreignKey: 'id', // A chave estrangeira em ATLETAS é o 'id'
    as: 'perfilAtleta'
});
// O perfil de Atleta pertence a UM Usuário
db.Atleta.belongsTo(db.Usuario, {
    foreignKey: 'id', // A chave estrangeira em ATLETAS é o 'id'
    as: 'usuario'
});

// 5. Relação Modalidade <-> Graduacao (NOVO)
// Uma Modalidade (ex: Jiu-Jitsu) tem VÁRIAS Graduações (Faixas)
db.Modalidade.hasMany(db.Graduacao, {
    foreignKey: 'modalidade_id',
    as: 'graduacoes'
});
// Uma Graduação (ex: Faixa Azul) pertence a UMA Modalidade
db.Graduacao.belongsTo(db.Modalidade, {
    foreignKey: 'modalidade_id',
    as: 'modalidade'
});

// Um Atleta pode ter VÁRIAS Filiações (ex: uma no Jiu-Jitsu, outra no Muay Thai)
db.Atleta.hasMany(db.Filiacao, {
    foreignKey: 'atleta_id',
    as: 'filiacoes'
});
db.Filiacao.belongsTo(db.Atleta, {
    foreignKey: 'atleta_id',
    as: 'atleta'
});

// Uma Academia pode ter VÁRIAS Filiações
db.Academia.hasMany(db.Filiacao, {
    foreignKey: 'academia_id',
    as: 'filiacoes'
});
db.Filiacao.belongsTo(db.Academia, {
    foreignKey: 'academia_id',
    as: 'academia'
});

// Uma Modalidade pode estar em VÁRIAS Filiações
db.Modalidade.hasMany(db.Filiacao, {
    foreignKey: 'modalidade_id',
    as: 'filiacoes'
});
db.Filiacao.belongsTo(db.Modalidade, {
    foreignKey: 'modalidade_id',
    as: 'modalidade'
});

// Uma Graduação pode estar em VÁRIAS Filiações
db.Graduacao.hasMany(db.Filiacao, {
    foreignKey: 'graduacao_id',
    as: 'filiacoes'
});
db.Filiacao.belongsTo(db.Graduacao, {
    foreignKey: 'graduacao_id',
    as: 'graduacao'
});

// Um Usuário (Professor) pode aprovar VÁRIAS Filiações
db.Usuario.hasMany(db.Filiacao, {
    foreignKey: 'professor_id',
    as: 'filiacoesAprovadas'
});
db.Filiacao.belongsTo(db.Usuario, {
    foreignKey: 'professor_id',
    as: 'professorResponsavel'
});
// (Quando criarmos os outros modelos, adicionaremos as outras associações aqui)
// Ex: db.Atleta.hasMany(db.Filiacao, ...);
// 7. Relação Filiacao <-> Documento (NOVO)
// Uma Filiação pode ter VÁRIOS Documentos
db.Filiacao.hasMany(db.Documento, {
    foreignKey: 'filiacao_id',
    as: 'documentos'
});
// Um Documento pertence a UMA Filiação
db.Documento.belongsTo(db.Filiacao, {
    foreignKey: 'filiacao_id',
    as: 'filiacao'
});

// 8. Relações com Pagamento (NOVO)

// Uma Filiação pode ter VÁRIAS tentativas de Pagamento
db.Filiacao.hasMany(db.Pagamento, {
    foreignKey: 'filiacao_id',
    as: 'pagamentos'
});
db.Pagamento.belongsTo(db.Filiacao, {
    foreignKey: 'filiacao_id',
    as: 'filiacao'
});

// Um Método de Pagamento (ex: PIX) pode ser usado em VÁRIOS Pagamentos
db.MetodoPagamento.hasMany(db.Pagamento, {
    foreignKey: 'metodo_pagamento_id',
    as: 'pagamentos'
});
db.Pagamento.belongsTo(db.MetodoPagamento, {
    foreignKey: 'metodo_pagamento_id',
    as: 'metodoPagamento'
});

// 10) Módulo de Competições

// Evento <-> Modalidades (N:N)
db.CompeticaoEvento.belongsToMany(db.CompeticaoModalidade, {
    through: db.CompeticaoEventoModalidade,
    foreignKey: 'evento_id',
    otherKey: 'competicao_modalidade_id',
    as: 'modalidades'
});
db.CompeticaoModalidade.belongsToMany(db.CompeticaoEvento, {
    through: db.CompeticaoEventoModalidade,
    foreignKey: 'competicao_modalidade_id',
    otherKey: 'evento_id',
    as: 'eventos'
});

// CompeticaoModalidade (competição) -> Modalidade (filiacao) (opcional)
db.Modalidade.hasMany(db.CompeticaoModalidade, {
    foreignKey: 'filiacao_modalidade_id',
    as: 'modalidadesCompeticao'
});
db.CompeticaoModalidade.belongsTo(db.Modalidade, {
    foreignKey: 'filiacao_modalidade_id',
    as: 'modalidadeFiliacao'
});

// Inscrição pertence a evento/atleta/filiação/modalidade de competição
db.CompeticaoEvento.hasMany(db.CompeticaoInscricao, {
    foreignKey: 'evento_id',
    as: 'inscricoes'
});
db.CompeticaoInscricao.belongsTo(db.CompeticaoEvento, {
    foreignKey: 'evento_id',
    as: 'evento'
});

db.Atleta.hasMany(db.CompeticaoInscricao, {
    foreignKey: 'atleta_id',
    as: 'inscricoesCompeticao'
});
db.CompeticaoInscricao.belongsTo(db.Atleta, {
    foreignKey: 'atleta_id',
    as: 'atleta'
});

db.Filiacao.hasMany(db.CompeticaoInscricao, {
    foreignKey: 'filiacao_id',
    as: 'inscricoesCompeticao'
});
db.CompeticaoInscricao.belongsTo(db.Filiacao, {
    foreignKey: 'filiacao_id',
    as: 'filiacao'
});

db.CompeticaoModalidade.hasMany(db.CompeticaoInscricao, {
    foreignKey: 'competicao_modalidade_id',
    as: 'inscricoes'
});
db.CompeticaoInscricao.belongsTo(db.CompeticaoModalidade, {
    foreignKey: 'competicao_modalidade_id',
    as: 'competicaoModalidade'
});

// Autorização
db.CompeticaoEvento.hasMany(db.CompeticaoAutorizacao, {
    foreignKey: 'evento_id',
    as: 'autorizacoes'
});
db.CompeticaoAutorizacao.belongsTo(db.CompeticaoEvento, {
    foreignKey: 'evento_id',
    as: 'evento'
});

db.Atleta.hasMany(db.CompeticaoAutorizacao, {
    foreignKey: 'atleta_id',
    as: 'autorizacoesCompeticao'
});
db.CompeticaoAutorizacao.belongsTo(db.Atleta, {
    foreignKey: 'atleta_id',
    as: 'atleta'
});

// Pagamento -> Inscrição (opcional)
db.CompeticaoInscricao.hasMany(db.Pagamento, {
    foreignKey: 'competicao_inscricao_id',
    as: 'pagamentos'
});
db.Pagamento.belongsTo(db.CompeticaoInscricao, {
    foreignKey: 'competicao_inscricao_id',
    as: 'competicaoInscricao'
});
// 9. Relação Usuario (Autor) <-> Noticia (NOVO)
// Um Usuário (Admin/Autor) pode escrever VÁRIAS Notícias
db.Usuario.hasMany(db.Noticia, {
    foreignKey: 'autor_id',
    as: 'noticias'
});
// Uma Notícia pertence a UM Autor (Usuário)
db.Noticia.belongsTo(db.Usuario, {
    foreignKey: 'autor_id',
    as: 'autor'
});

// Exporta a conexão e todos os modelos
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;