const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');

// @route   POST /api/auth/registrar
// @desc    Registra um novo usuário
// @access  Público
router.post('/registrar', registrar);

// @route   POST /api/auth/login
// @desc    Autentica (login) um usuário
// @access  Público
router.post('/login', login);

module.exports = router;