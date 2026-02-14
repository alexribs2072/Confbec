const express = require('express');
const router = express.Router();
const metodoPagamentoController = require('../controllers/metodoPagamentoController');

// Importa os middlewares de auth
// 'protegerOpcional' é um truque para carregar req.usuario se existir, mas não falhar se não existir
const { proteger, checkAdmin } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const db = require('../models');

// Middleware de proteção opcional (para a rota GET pública)
const protegerOpcional = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.usuario = await db.Usuario.findByPk(decoded.id, { attributes: ['id', 'tipo'] });
        } catch (error) {
            // Ignora o erro se o token for inválido/expirado, pois é opcional
            req.usuario = null;
        }
    }
    next();
};

// Rotas
router.route('/')
    // Rota pública (ou semi-pública) para listar métodos
    .get(protegerOpcional, metodoPagamentoController.getAllMetodosPagamento) 
    // Rota de Admin para criar
    .post(proteger, checkAdmin, metodoPagamentoController.createMetodoPagamento);

router.route('/:id')
    // Rotas de Admin para atualizar e deletar
    .put(proteger, checkAdmin, metodoPagamentoController.updateMetodoPagamento)
    .delete(proteger, checkAdmin, metodoPagamentoController.deleteMetodoPagamento);

module.exports = router;