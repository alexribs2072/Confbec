const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// Fatura agregada de inscrições (1 cobrança para N submodalidades)
const CompeticaoInvoice = sequelize.define('CompeticaoInvoice', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  atleta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  evento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'PAGO', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'PENDENTE',
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  gateway: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  id_transacao_gateway: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
}, {
  tableName: 'competicao_invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoInvoice;
