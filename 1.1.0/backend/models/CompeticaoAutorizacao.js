const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const CompeticaoAutorizacao = sequelize.define('CompeticaoAutorizacao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // evento_id e atleta_id virão pelas associações
  authority: {
    type: DataTypes.ENUM('FEDERACAO_ESTADUAL', 'CONFBEC'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'APROVADA', 'NEGADA'),
    allowNull: false,
    defaultValue: 'PENDENTE',
  },
  requested_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'competicao_autorizacoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoAutorizacao;
