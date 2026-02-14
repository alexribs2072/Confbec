// --- INÍCIO DO ARQUIVO ---
// /routes/filiacaoRoutes.js
const express = require('express');
const router = express.Router();
// 1. Importa o controlador (garanta que o caminho está correto)
const filiacaoController = require('../controllers/filiacaoController');

// 2. Importa os middlewares (garanta que o caminho está correto)
const {
    proteger,               // Garante login
    checkAdmin,             // Garante Admin
    checkProfessorOrAdmin   // Garante Prof/Treinador/Admin
} = require('../middleware/authMiddleware');

// --- DEFINIÇÃO COMPLETA DAS ROTAS ---

// POST /api/filiacoes (Atleta cria)
router.route('/')
    .post(proteger, filiacaoController.createFiliacao);

// GET /api/filiacoes/me (Atleta busca suas)
router.route('/me')
    .get(proteger, filiacaoController.getMinhasFiliacoes);

// PUT /api/filiacoes/:id/submeter-docs (Atleta submete docs)
router.route('/:id/submeter-docs')
    .put(proteger, filiacaoController.submeterDocumentosFiliacao); // <- Função chave

// GET /api/filiacoes/pendentes-docs (Admin busca pendentes de docs)
router.route('/pendentes-docs')
    .get(proteger, checkAdmin, filiacaoController.getFiliacoesPendentesDocs);

// GET /api/filiacoes/pendentes-professor (Prof/Admin busca pendentes de vínculo)
router.route('/pendentes-professor')
    .get(proteger, checkProfessorOrAdmin, filiacaoController.getFiliacoesPendentesProfessor);

// PUT /api/filiacoes/:id/revisar-docs (Admin revisa docs)
router.route('/:id/revisar-docs')
    .put(proteger, checkAdmin, filiacaoController.revisarDocumentosFiliacao);

// PUT /api/filiacoes/:id/revisar-vinculo (Prof/Admin revisa vínculo)
router.route('/:id/revisar-vinculo')
    .put(proteger, checkProfessorOrAdmin, filiacaoController.revisarVinculoFiliacao);

// GET /api/filiacoes/:id (Busca detalhes de uma filiação)
router.route('/:id')
    .get(proteger, filiacaoController.getFiliacaoById);

// Exporta o router
module.exports = router;
// --- FIM DO ARQUIVO ---