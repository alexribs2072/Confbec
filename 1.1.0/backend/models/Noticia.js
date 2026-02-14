const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Noticia = sequelize.define('Noticia', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subtitulo: {
        type: DataTypes.TEXT
    },
    conteudo: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imagem_url: {
        type: DataTypes.STRING(1024) // Link para uma imagem de capa
    },
    // 'autor_id' será criado pela associação (Usuário Admin)
    publicada_em: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'noticias',
    timestamps: true // createdAt e updatedAt
});

module.exports = Noticia;