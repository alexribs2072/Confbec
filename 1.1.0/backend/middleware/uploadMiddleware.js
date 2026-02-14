const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 1. Extrai o ID do usuário (atleta) definido no middleware 'proteger'
        const userId = req.usuario.id; 
        
        // 2. Define o caminho: uploads/documentos/ID_DO_ATLETA
        const uploadPath = path.join(__dirname, '../uploads/documentos', String(userId));

        // 3. Cria a pasta do aluno de forma recursiva se não existir
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Gera um nome único mantendo a extensão original para evitar sobreposição
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extensao = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extensao}`);
    }
});

// Filtro de segurança para aceitar imagens e PDFs (comum em atestados/RG)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado! Apenas JPG, PNG e PDF são permitidos.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10 // Limite de 10MB para documentos
    },
    fileFilter: fileFilter
});

module.exports = upload;