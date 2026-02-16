const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Pagamento = sequelize.define('Pagamento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  // ✅ Tipo do pagamento: filiação, competição, curso
  tipo: {
    type: DataTypes.ENUM('filiacao', 'competicao', 'curso'),
    allowNull: false,
    defaultValue: 'filiacao'
  },

  // ✅ Valor total esperado/cobrado (header da fatura)
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },

  // Mantido por compatibilidade: em vários pontos do sistema o "valor_pago"
  // é usado como valor da cobrança/registro. Para novos fluxos, valor_total é o principal.
  valor_pago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },

  status: {
    type: DataTypes.ENUM('pendente', 'pago', 'falhou', 'reembolsado', 'cancelado'),
    allowNull: false,
    defaultValue: 'pendente'
  },

  // Competição (quando tipo='competicao')
  evento_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  atleta_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  id_transacao_gateway: {
    type: DataTypes.STRING,
    unique: true
  },
  data_pagamento: {
    type: DataTypes.DATE
  },
  qr_code_pix: {
    type: DataTypes.TEXT
  },
  linha_digitavel_boleto: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'pagamentos',
  timestamps: true
});

module.exports = Pagamento;
