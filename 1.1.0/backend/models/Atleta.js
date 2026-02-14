const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Atleta = sequelize.define('Atleta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
        // Esta NÃO é autoIncrement. Ela será o valor
        // do ID do Usuário ao qual este perfil pertence.
    },
    nome_completo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    data_nascimento: {
        type: DataTypes.DATEONLY, // Armazena apenas a data (AAAA-MM-DD)
        allowNull: false
    },
    rg: {
        type: DataTypes.STRING(50)
    },
    cpf: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    logradouro: DataTypes.STRING,
    cep: DataTypes.STRING(20),
    bairro: DataTypes.STRING,
    cidade: DataTypes.STRING,
    estado: DataTypes.STRING(2),
    telefone_contato: DataTypes.STRING(20),
    foto_url: {
        type: DataTypes.STRING(1024),
        allowNull: true
    }
}, {
    tableName: 'atletas',
    timestamps: true
});

module.exports = Atleta;