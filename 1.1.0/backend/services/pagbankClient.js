// /services/pagbankClient.js
// Cliente mínimo do PagBank (Pedidos PIX via Orders API)
//
// Variáveis de ambiente:
// - PAGBANK_API_URL (ex.: https://sandbox.api.pagseguro.com ou produção)
// - PAGBANK_TOKEN

const axios = require('axios');

function getBaseUrl() {
  return process.env.PAGBANK_API_URL || 'https://sandbox.api.pagseguro.com';
}

function getToken() {
  const token = process.env.PAGBANK_TOKEN;
  if (!token) throw new Error('PAGBANK_TOKEN não configurado.');
  return token;
}

const http = axios.create({
  baseURL: getBaseUrl(),
  timeout: 20000,
});

async function createOrderPix(payload) {
  return http.post('/orders', payload, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });
}

async function getOrder(orderId) {
  return http.get(`/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

module.exports = {
  createOrderPix,
  getOrder,
};
