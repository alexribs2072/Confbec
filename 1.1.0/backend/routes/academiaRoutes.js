const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');

// Importa os mesmos middlewares de autenticação
const { proteger, checkAdmin } = require('../middleware/authMiddleware');

// Rota para Criar (POST) e Listar (GET)
router.route('/')
    .post(proteger, checkAdmin, academiaController.createAcademia) // Protegido: Admin
    .get(academiaController.getAllAcademias); // Público

// Rotas para Buscar por ID (GET), Atualizar (PUT) e Deletar (DELETE)
router.route('/:id')
    .get(academiaController.getAcademiaById) // Público
    .put(proteger, checkAdmin, academiaController.updateAcademia) // Protegido: Admin
    .delete(proteger, checkAdmin, academiaController.deleteAcademia); // Protegido: Admin

module.exports = router;