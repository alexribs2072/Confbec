const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const CompeticaoInscricao = sequelize.define('CompeticaoInscricao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // FKs
  evento_id: { type: DataTypes.INTEGER, allowNull: false },
  atleta_id: { type: DataTypes.INTEGER, allowNull: false },
  filiacao_id: { type: DataTypes.INTEGER, allowNull: false },
  competicao_modalidade_id: { type: DataTypes.INTEGER, allowNull: false },
  peso_kg: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  idade_anos: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  grupo_etario: {
    type: DataTypes.ENUM('KADETE', 'JUVENIL', 'ADULTO', 'MASTER', 'MASTER2'),
    allowNull: false,
  },
  divisao_idade: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  divisao_peso: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  categoria_combate: {
    type: DataTypes.ENUM('COLORIDAS', 'AVANCADA'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDENTE_PAGAMENTO', 'AGUARDANDO_AUTORIZACAO', 'CONFIRMADA', 'BLOQUEADA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'PENDENTE_PAGAMENTO',
  },
  motivo_bloqueio: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'competicao_inscricoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoInscricao;
