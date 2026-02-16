const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const PagamentoItem = sequelize.define('PagamentoItem', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  pagamento_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // referência opcional à inscrição da competição (quando tipo='competicao')
  competicao_inscricao_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },

  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
}, {
  tableName: 'pagamentos_itens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PagamentoItem;
