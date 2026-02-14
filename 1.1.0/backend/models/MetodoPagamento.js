// /models/MetodoPagamento.js

// Usamos a importação segura de DataTypes que funcionou antes
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes; 
const sequelize = require('../config/connection');

const MetodoPagamento = sequelize.define('MetodoPagamento', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING(100), // Ex: "PIX", "Boleto"
        allowNull: false
    },
    taxa_filiacao: {
        type: DataTypes.DECIMAL(10, 2), // Ex: 150.00
        allowNull: false,
        defaultValue: 0.00
    },
    configuracao: {
        type: DataTypes.JSON, // Para guardar chaves de API, Chave PIX, etc.
        allowNull: true
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'metodo_pagamentos',
    timestamps: true
});

module.exports = MetodoPagamento;