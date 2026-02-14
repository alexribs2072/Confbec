const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Pagamento = sequelize.define('Pagamento', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // 'filiacao_id' será criada pela associação
    // 'metodo_pagamento_id' será criada pela associação
    valor_pago: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pendente', 'pago', 'falhou', 'reembolsado'),
        allowNull: false,
        defaultValue: 'pendente'
    },
    id_transacao_gateway: {
        type: DataTypes.STRING, // ID do MercadoPago, Stripe, etc.
        unique: true
    },
    data_pagamento: {
        type: DataTypes.DATE
    },
    qr_code_pix: {
        type: DataTypes.TEXT // Para guardar o "copia e cola" do PIX
    },
    linha_digitavel_boleto: {
        type: DataTypes.TEXT // Para guardar a linha do boleto
    }
}, {
    tableName: 'pagamentos',
    timestamps: true
});

module.exports = Pagamento;