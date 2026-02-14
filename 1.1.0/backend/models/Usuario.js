// /models/Usuario.js
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;
const sequelize = require('../config/connection');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('atleta', 'professor', 'treinador', 'admin'),
        allowNull: false,
        defaultValue: 'atleta'
    },
    // --- ADICIONADO ---
    nome: {
        type: DataTypes.STRING,
        allowNull: true // Permite nulo para compatibilidade
    }
    // -----------------
}, {
    tableName: 'usuarios',
    timestamps: true, // Adiciona createdAt e updatedAt
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.senha) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha = await bcrypt.hash(usuario.senha, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('senha')) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha = await bcrypt.hash(usuario.senha, salt);
            }
        }
    }
});

Usuario.prototype.compararSenha = function (senhaEntrada) {
    return bcrypt.compare(senhaEntrada, this.senha);
};

module.exports = Usuario;