const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// Tabela criada no patch_competicoes_incremental_v2.sql

const CompeticaoModalidade = sequelize.define('CompeticaoModalidade', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('TROCACAO', 'GRAPPLING', 'MISTO'),
    allowNull: false,
  },
  // Submodalidade pertence a uma Modalidade (mãe) do módulo de filiações (ex: Kickboxing)
  modalidade_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Campo legado (mantido para compatibilidade). Preferir usar modalidade_id.
  filiacao_modalidade_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'competicao_modalidades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoModalidade;
