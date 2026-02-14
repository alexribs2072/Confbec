const express = require('express');
const router = express.Router();
const modalidadeController = require('../controllers/modalidadeController');
const { proteger, checkAdmin } = require('../middleware/authMiddleware');

// Rotas públicas (GET) e privadas (POST)
router.route('/')
    .post(proteger, checkAdmin, modalidadeController.createModalidade)
    .get(modalidadeController.getAllModalidades);

// Rotas privadas (PUT, DELETE) por ID
router.route('/:id')
    .put(proteger, checkAdmin, modalidadeController.updateModalidade)
    .delete(proteger, checkAdmin, modalidadeController.deleteModalidade);

module.exports = router;