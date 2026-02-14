const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/connection'); // Usando o 'connection.js' que renomeamos

const Federacao = sequelize.define('Federacao', {
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
    // A chave estrangeira 'representante_id' será adicionada 
    // automaticamente quando definirmos a associação com 'Usuario'.
    // Não precisamos declará-la aqui.
}, {
    tableName: 'federacoes',
    timestamps: true // Pega createdAt e updatedAt
});

module.exports = Federacao;