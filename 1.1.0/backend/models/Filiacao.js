const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Filiacao = sequelize.define('Filiacao', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // 'atleta_id' será criado pela associação com Atleta
    // 'academia_id' será criado pela associação com Academia
    // 'modalidade_id' será criado pela associação com Modalidade
    // 'graduacao_id' será criado pela associação com Graduacao
    // 'professor_id' será criado pela associação com Usuario

    status: {
    type: DataTypes.ENUM(
        'pendente_documentos',      // Aguardando upload inicial
        'pendente_aprovacao_docs',  // Docs enviados, aguardando Admin
        'pendente_aprovacao_professor',// Docs OK, aguardando Professor
        'pendente_pagamento',       // Professor OK, aguardando Pagamento
        'ativo',                    // Pago e ativo
        'rejeitado',                // Rejeitado em alguma etapa
        'inativo'                   // Expirado ou cancelado
    ),
    allowNull: false,
    defaultValue: 'pendente_documentos'
    },
    
    data_solicitacao: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    data_aprovacao: {
        type: DataTypes.DATEONLY
    },
    data_vencimento: {
        type: DataTypes.DATEONLY // Para controlar renovações anuais
    }
}, {
    tableName: 'filiacoes',
    timestamps: true
});

module.exports = Filiacao;