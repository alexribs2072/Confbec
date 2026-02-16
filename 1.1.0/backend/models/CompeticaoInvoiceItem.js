const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const CompeticaoInvoiceItem = sequelize.define('CompeticaoInvoiceItem', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  invoice_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  competicao_inscricao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'competicao_invoice_itens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CompeticaoInvoiceItem;
