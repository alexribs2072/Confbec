const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// Tabela de junção evento <-> submodalidade, com taxa por submodalidade
const CompeticaoEventoModalidade = sequelize.define('CompeticaoEventoModalidade', {
  evento_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  competicao_modalidade_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  taxa_inscricao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'competicao_evento_modalidades',
  timestamps: false,
});

module.exports = CompeticaoEventoModalidade;
