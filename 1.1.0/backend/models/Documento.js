const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Documento = sequelize.define('Documento', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // 'filiacao_id' será criado pela associação
    tipo_documento: {
        type: DataTypes.ENUM(
            'atestado_medico', 
            'certificado_graduacao', 
            'rg_frente', 
            'rg_verso', 
            'comprovante_residencia',
            'outro' // Adicionado para flexibilidade
        ),
        allowNull: false
    },
    url_arquivo: {
        type: DataTypes.STRING(1024), // Caminho do arquivo (ex: 'uploads/documento-123.pdf')
        allowNull: false
    },
    nome_original: {
        type: DataTypes.STRING, // O nome original do arquivo (ex: 'meu_atestado.pdf')
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pendente', 'aprovado', 'rejeitado'),
        allowNull: false,
        defaultValue: 'pendente'
    },
    data_upload: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'documentos',
    timestamps: true
});

module.exports = Documento;