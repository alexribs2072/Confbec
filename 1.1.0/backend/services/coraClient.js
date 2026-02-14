// /services/coraClient.js
// Cliente mínimo para Integração Direta da Cora (mTLS + OAuth client_credentials)
//
// Variáveis de ambiente:
// - CORA_ENV=stage|prod (default: stage)
// - CORA_CLIENT_ID
// - CORA_CERT_PATH (ou CORA_CERT_PEM)
// - CORA_KEY_PATH  (ou CORA_KEY_PEM)
// - CORA_BASE_URL  (opcional: sobrescreve a URL base mTLS)

const fs = require('node:fs');
const https = require('node:https');
const axios = require('axios');

function loadPemFromEnvOrPath(envPem, envPath, label) {
  if (envPem && String(envPem).trim()) return String(envPem);
  if (!envPath) {
    throw new Error(`${label} não configurado. Use ${label}_PATH ou ${label}_PEM no .env`);
  }
  return fs.readFileSync(envPath, 'utf8');
}

function getBaseUrl() {
  if (process.env.CORA_BASE_URL) return process.env.CORA_BASE_URL;
  const env = (process.env.CORA_ENV || 'stage').toLowerCase();
  return (env === 'prod' || env === 'production')
    ? 'https://matls-clients.api.cora.com.br'
    : 'https://matls-clients.api.stage.cora.com.br';
}

let cachedToken = null; // { token, expMs }

function createHttpClient() {
  const cert = loadPemFromEnvOrPath(process.env.CORA_CERT_PEM, process.env.CORA_CERT_PATH, 'CORA_CERT');
  const key = loadPemFromEnvOrPath(process.env.CORA_KEY_PEM, process.env.CORA_KEY_PATH, 'CORA_KEY');

  const httpsAgent = new https.Agent({ cert, key });

  return axios.create({
    baseURL: getBaseUrl(),
    httpsAgent,
    timeout: 20000,
  });
}

let http = null;
function getHttp() {
  if (http) return http;
  http = createHttpClient();
  return http;
}

async function getToken() {
  const clientId = process.env.CORA_CLIENT_ID;
  if (!clientId) throw new Error('CORA_CLIENT_ID não configurado.');

  const now = Date.now();
  if (cachedToken && now < cachedToken.expMs - 60_000) return cachedToken.token;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
  });

  const { data } = await getHttp().post('/token', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const token = data?.access_token;
  if (!token) throw new Error('Cora token: resposta sem access_token.');

  const expiresIn = Number(data?.expires_in || 3600);
  cachedToken = { token, expMs: now + expiresIn * 1000 };
  return token;
}

async function createInvoice(payload, { idempotencyKey } = {}) {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const { data } = await getHttp().post('/v2/invoices', payload, { headers });
  return data;
}

async function getInvoice(invoiceId) {
  const token = await getToken();
  const { data } = await getHttp().get(`/v2/invoices/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

module.exports = {
  createInvoice,
  getInvoice,
};
