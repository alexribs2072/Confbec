const express = require('express');
const router = express.Router();

// Importa o controlador
const federacaoController = require('../controllers/federacaoController');

// Importa os middlewares de autenticação
const { proteger, checkAdmin } = require('../middleware/authMiddleware');

// --- Definindo as Rotas ---

// Rota para Criar (POST) e Listar (GET)
router.route('/')
    .post(proteger, checkAdmin, federacaoController.createFederacao) // Protegido: Apenas Admin
    .get(federacaoController.getAllFederacoes); // Público

// Rotas para Buscar por ID (GET), Atualizar (PUT) e Deletar (DELETE)
router.route('/:id')
    .get(federacaoController.getFederacaoById) // Público
    .put(proteger, checkAdmin, federacaoController.updateFederacao) // Protegido: Apenas Admin
    .delete(proteger, checkAdmin, federacaoController.deleteFederacao); // Protegido: Apenas Admin

module.exports = router;