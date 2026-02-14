const express = require('express');
const router = express.Router();
const graduacaoController = require('../controllers/graduacaoController');
const { proteger, checkAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .post(proteger, checkAdmin, graduacaoController.createGraduacao)
    .get(graduacaoController.getAllGraduacoes);

router.route('/:id')
    .put(proteger, checkAdmin, graduacaoController.updateGraduacao)
    .delete(proteger, checkAdmin, graduacaoController.deleteGraduacao);

module.exports = router;