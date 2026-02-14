const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Graduacao = sequelize.define('Graduacao', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false // Ex: "Faixa Azul", "Grau Vermelho"
    },
    restricao_idade: {
        type: DataTypes.STRING(100) // Ex: "menor_15", "maior_15", "adulto"
    },
    ordem: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Para ordenar as faixas (Branca=1, Azul=2, etc)
    }
    // A chave 'modalidade_id' será criada pela associação
}, {
    tableName: 'graduacoes',
    timestamps: true
});

module.exports = Graduacao;