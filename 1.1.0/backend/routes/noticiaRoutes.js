const express = require('express');
const router = express.Router();
const noticiaController = require('../controllers/noticiaController');
const { proteger, checkAdmin } = require('../middleware/authMiddleware');

// Rotas públicas (GET)
router.route('/')
    .get(noticiaController.getAllNoticias)
    .post(proteger, checkAdmin, noticiaController.createNoticia); // Admin cria

router.route('/:id')
    .get(noticiaController.getNoticiaById)
    .put(proteger, checkAdmin, noticiaController.updateNoticia) // Admin atualiza
    .delete(proteger, checkAdmin, noticiaController.deleteNoticia); // Admin deleta

module.exports = router;