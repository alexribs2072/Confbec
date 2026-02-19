const express = require('express');
const router = express.Router();

const competicaoController = require('../controllers/competicaoController');
const { proteger, protegerOpcional, checkAdmin } = require('../middleware/authMiddleware');

// ===== Eventos =====
router.get('/eventos', protegerOpcional, competicaoController.listarEventos);
router.get('/eventos/:eventoId', protegerOpcional, competicaoController.getEvento);
router.post('/eventos', proteger, checkAdmin, competicaoController.criarEvento);
router.put('/eventos/:eventoId', proteger, checkAdmin, competicaoController.atualizarEvento);
router.delete('/eventos/:eventoId', proteger, checkAdmin, competicaoController.excluirEvento);
router.put('/eventos/:eventoId/modalidades', proteger, checkAdmin, competicaoController.atualizarModalidadesDoEvento);

// ===== Modalidades de competição =====
router.get('/modalidades', proteger, checkAdmin, competicaoController.listarModalidades);
router.put('/modalidades/:modalidadeId', proteger, checkAdmin, competicaoController.atualizarModalidade);

// ===== Submodalidades (CRUD) =====
router.get('/submodalidades', proteger, checkAdmin, competicaoController.listarSubmodalidades);
router.post('/submodalidades', proteger, checkAdmin, competicaoController.criarSubmodalidade);
router.put('/submodalidades/:submodalidadeId', proteger, checkAdmin, competicaoController.atualizarSubmodalidade);
router.delete('/submodalidades/:submodalidadeId', proteger, checkAdmin, competicaoController.excluirSubmodalidade);

// ===== Elegibilidade / inscrições =====
router.get('/eventos/:eventoId/elegibilidade', proteger, competicaoController.elegibilidadeEvento);
router.post('/eventos/:eventoId/inscricoes', proteger, competicaoController.criarInscricao);
router.get('/inscricoes/me', proteger, competicaoController.minhasInscricoes);
router.get('/inscricoes/:inscricaoId', proteger, competicaoController.getInscricao);
router.put('/inscricoes/:inscricaoId', proteger, competicaoController.atualizarInscricaoAtleta);
router.delete('/inscricoes/:inscricaoId', proteger, competicaoController.cancelarInscricao);

// ===== Faturas/Pagamentos (agregado) =====
router.get('/pagamentos/me', proteger, competicaoController.minhasFaturas);
router.get('/pagamentos/:pagamentoId', proteger, competicaoController.getFatura);

// Pagamento da inscrição
router.post('/inscricoes/:inscricaoId/criar-cobranca', proteger, competicaoController.criarCobrancaInscricao);

// ===== Admin: inscrições e autorizações =====
router.get('/eventos/:eventoId/inscricoes', proteger, checkAdmin, competicaoController.listarInscricoesEvento);
router.get('/eventos/:eventoId/autorizacoes', proteger, checkAdmin, competicaoController.listarAutorizacoesEvento);
router.put('/autorizacoes/:autorizacaoId', proteger, checkAdmin, competicaoController.revisarAutorizacao);

module.exports = router;
