const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// Tabela de junção evento <-> modalidade (PK composta)

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
}, {
  tableName: 'competicao_evento_modalidades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoEventoModalidade;
