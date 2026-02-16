const express = require('express');
const router = express.Router();

const competicaoController = require('../controllers/competicaoController');
const { proteger, protegerOpcional, checkAdmin } = require('../middleware/authMiddleware');

// ===== Eventos =====
router.get('/eventos', protegerOpcional, competicaoController.listarEventos);
router.get('/eventos/:eventoId', protegerOpcional, competicaoController.getEvento);

router.post('/eventos', proteger, checkAdmin, competicaoController.criarEvento);
router.put('/eventos/:eventoId', proteger, checkAdmin, competicaoController.atualizarEvento);
router.put('/eventos/:eventoId/modalidades', proteger, checkAdmin, competicaoController.atualizarModalidadesDoEvento);

// ===== Submodalidades (modalidades de competição) =====
router.get('/submodalidades', proteger, checkAdmin, competicaoController.listarSubmodalidades);
router.post('/submodalidades', proteger, checkAdmin, competicaoController.criarSubmodalidade);
router.put('/submodalidades/:submodalidadeId', proteger, checkAdmin, competicaoController.atualizarSubmodalidade);
router.delete('/submodalidades/:submodalidadeId', proteger, checkAdmin, competicaoController.excluirSubmodalidade);

// ===== Elegibilidade / inscrições =====
router.get('/eventos/:eventoId/elegibilidade', proteger, competicaoController.elegibilidadeEvento);

// cria N inscrições e 1 invoice com itens (cobrança única)
router.post('/eventos/:eventoId/inscricoes', proteger, competicaoController.criarInscricao);

router.get('/inscricoes/me', proteger, competicaoController.minhasInscricoes);
router.get('/inscricoes/:inscricaoId', proteger, competicaoController.detalheInscricao);
router.delete('/inscricoes/:inscricaoId', proteger, competicaoController.cancelarInscricao);

// ===== Invoice (fatura) =====
router.get('/invoices/me', proteger, competicaoController.minhasInvoices);
router.get('/invoices/:invoiceId', proteger, competicaoController.getInvoice);
router.post('/invoices/:invoiceId/criar-cobranca', proteger, competicaoController.criarCobrancaInvoice);
router.delete('/invoices/:invoiceId', proteger, competicaoController.cancelarInvoice);

// ===== Admin: inscrições, invoices e autorizações =====
router.get('/eventos/:eventoId/inscricoes', proteger, checkAdmin, competicaoController.listarInscricoesEvento);
router.put('/inscricoes/:inscricaoId', proteger, checkAdmin, competicaoController.atualizarInscricaoAdmin);

router.get('/eventos/:eventoId/invoices', proteger, checkAdmin, competicaoController.listarInvoicesEvento);
router.put('/invoices/:invoiceId', proteger, checkAdmin, competicaoController.atualizarInvoiceAdmin);

router.get('/eventos/:eventoId/autorizacoes', proteger, checkAdmin, competicaoController.listarAutorizacoesEvento);
router.put('/autorizacoes/:autorizacaoId', proteger, checkAdmin, competicaoController.revisarAutorizacao);

module.exports = router;
