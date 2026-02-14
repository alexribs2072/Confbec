const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');

// Importa os middlewares de auth
const { proteger, checkProfessorOrAdmin } = require('../middleware/authMiddleware');

// Importa o middleware de upload (multer)
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/documentos/upload/:filiacaoId
// @desc    Fazer upload de um arquivo. 'documento' é o nome do campo no form-data
router.post(
    '/upload/:filiacaoId', 
    proteger, // 1. Verifica se está logado
    upload.single('documento'), // 2. Processa o upload do arquivo
    documentoController.uploadDocumento // 3. Roda o controlador
);

// @route   GET /api/documentos/:filiacaoId
// @desc    Listar documentos de uma filiação
router.get(
    '/:filiacaoId',
    proteger,
    documentoController.getDocumentosPorFiliacao
);

// @route   PUT /api/documentos/:documentoId/status
// @desc    Aprovar/Rejeitar um documento
router.put(
    '/:documentoId/status',
    proteger,
    checkProfessorOrAdmin, // Apenas professor ou admin
    documentoController.updateStatusDocumento
);

// @route   DELETE /api/documentos/:documentoId
// @desc    Deletar um documento
router.delete(
    '/:documentoId',
    proteger, // Apenas o dono ou admin (lógica no controller)
    documentoController.deleteDocumento
);

module.exports = router;