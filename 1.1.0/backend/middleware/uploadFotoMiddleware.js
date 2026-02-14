// /middleware/uploadFotoMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.usuario?.id;
    if (!userId) return cb(new Error('Usuário não autenticado (req.usuario ausente).'));

    // ./uploads/documentos/<id_do_usuario>
    const uploadPath = path.join(__dirname, '../uploads/documentos', String(userId));
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `foto-${uniqueSuffix}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Apenas arquivos de imagem são permitidos.'), false);
};

module.exports = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
  fileFilter: imageFileFilter
});
