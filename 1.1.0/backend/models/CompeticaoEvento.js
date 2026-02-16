const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// Tabela criada no patch_competicoes_incremental_v2.sql
// Observação: usa created_at/updated_at (snake_case)

const CompeticaoEvento = sequelize.define('CompeticaoEvento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // Modalidade mãe (tabela `modalidades`) usada para validar filiação
  modalidade_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nome: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  local: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  escopo: {
    type: DataTypes.ENUM('MUNICIPAL', 'ESTADUAL', 'NACIONAL', 'INTERNACIONAL'),
    allowNull: false,
    defaultValue: 'MUNICIPAL',
  },
  data_evento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'RASCUNHO',
      'INSCRICOES_ABERTAS',
      'INSCRICOES_ENCERRADAS',
      'EM_ANDAMENTO',
      'FINALIZADO',
      'CANCELADO'
    ),
    allowNull: false,
    defaultValue: 'RASCUNHO',
  },
  taxa_inscricao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'competicao_eventos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoEvento;
