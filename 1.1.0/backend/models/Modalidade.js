const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Modalidade = sequelize.define('Modalidade', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'modalidades',
    timestamps: true
});

module.exports = Modalidade;