const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/connection'); // Usando o 'connection.js'

const Academia = sequelize.define('Academia', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cnpj: {
        type: DataTypes.STRING,
        unique: true
    },
    logradouro: DataTypes.STRING,
    cep: DataTypes.STRING(20),
    bairro: DataTypes.STRING,
    cidade: DataTypes.STRING,
    estado: DataTypes.STRING(2),
    telefone: DataTypes.STRING(20),
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true
        }
    },
    // As chaves 'federacao_id' e 'responsavel_id' também
    // serão criadas pelas associações.
}, {
    tableName: 'academias',
    timestamps: true
});

module.exports = Academia;