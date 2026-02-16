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
  // Taxa por modalidade (cobrança por modalidade inscrita)
  taxa_inscricao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'competicao_evento_modalidades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoEventoModalidade;
