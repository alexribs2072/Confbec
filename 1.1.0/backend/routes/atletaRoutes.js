// --- INÍCIO DO ARQUIVO ---
const express = require('express');
const router = express.Router();

// 1. Importa o controlador do atleta
const atletaController = require('../controllers/atletaController'); // Verifique o caminho

// 2. Importa o middleware de proteção geral
const { proteger } = require('../middleware/authMiddleware'); // Verifique o caminho

// 3. Importa o middleware específico para upload de FOTO
const uploadFoto = require('../middleware/uploadFotoMiddleware'); // Verifique o caminho

// --- ROTAS PARA O PERFIL DO ATLETA LOGADO ('/api/atletas/me') ---

// Rota para buscar (GET) e criar/atualizar (POST) os dados do perfil
router.route('/me')
    .get(proteger, atletaController.getMeuPerfil) // Protegido: Só o usuário logado
    .post(proteger, atletaController.createOrUpdateMeuPerfil); // Protegido: Só o usuário logado

// Rota para fazer upload da FOTO do perfil
// @route   POST /api/atletas/me/foto
// @desc    Upload da foto de perfil do atleta logado
// @access  Privado (Atleta)
router.post(
    '/me/foto',                 // URL específica para a foto
    proteger,                   // 1. Garante que está logado
    uploadFoto.single('foto'),  // 2. Processa UM arquivo enviado no campo 'foto'
    atletaController.uploadMinhaFoto // 3. Chama a função do controller para salvar
);

// --- ROTAS FUTURAS DE ADMIN (Comentadas) ---
// router.route('/')
//    .get(proteger, checkAdmin, atletaController.getAllAtletas); // Exemplo
//
// router.route('/:id')
//    .get(proteger, checkAdmin, atletaController.getAtletaById); // Exemplo

// 4. Exporta o router configurado
module.exports = router;
// --- FIM DO ARQUIVO --- (Sem chave extra aqui)