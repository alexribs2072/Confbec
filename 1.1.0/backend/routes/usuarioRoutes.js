const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { proteger } = require('../middleware/authMiddleware');

// ✅ Perfil do usuário logado
router.get('/me', proteger, usuarioController.getMeuUsuario);
router.put('/me', proteger, usuarioController.updateMeuUsuario);

// Rota para buscar usuários por tipo (ex: /api/usuarios?tipo=professor,treinador)
router.route('/')
  .get(proteger, usuarioController.getUsuariosPorTipo);

module.exports = router;
