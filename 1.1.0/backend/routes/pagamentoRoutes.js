// --- INÍCIO DO ARQUIVO ---
// /routes/pagamentoRoutes.js
const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController'); // Importa o controller
const { proteger } = require('../middleware/authMiddleware'); // Middleware de proteção

// @route   POST /api/pagamentos/criar-cobranca/:filiacaoId
// @desc    Atleta logado cria uma nova cobrança (PIX/Boleto)
// @access  Privado (Atleta)
router.post(
    '/criar-cobranca/:filiacaoId',
    proteger, // Garante que o usuário está logado (atleta)
    pagamentoController.criarCobranca
);

// @route   POST /api/pagamentos/webhook/pagbank
// @desc    PagBank envia notificações de status de pagamento
// @access  Público (Acesso pelo PagBank)
router.post(
    '/webhook/pagbank',
    pagamentoController.receberWebhook
);


// @route   POST /api/pagamentos/webhook/cora
// @desc    Cora envia notificações de status de cobrança
// @access  Público (Acesso pela Cora)
router.post(
    '/webhook/cora',
    pagamentoController.receberWebhookCora
);

// @route   GET /api/pagamentos/:pagamentoId
// @desc    Busca detalhes de um pagamento específico
// @access  Privado (Atleta dono ou Admin)
router.get(
    '/:pagamentoId',
    proteger, // Garante que está logado
    pagamentoController.getPagamentoById
);
// -------------------------
module.exports = router;
// --- FIM DO ARQUIVO ---