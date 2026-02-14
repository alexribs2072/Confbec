const jwt = require('jsonwebtoken');
const db = require('../models');
const Usuario = db.Usuario;

// Middleware para verificar o token JWT (rota protegida)
exports.proteger = async (req, res, next) => {
    let token;

    // O token é enviado no header 'Authorization' como 'Bearer <token>'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extrair o token
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Anexar o usuário (sem a senha) ao objeto 'req'
            // para que as próximas rotas tenham acesso a ele
            req.usuario = await Usuario.findByPk(decoded.id, {
                attributes: { exclude: ['senha'] }
            });

            if (!req.usuario) {
                return res.status(401).json({ msg: 'Usuário não encontrado' });
            }

            next(); // Token válido, prossiga
        } catch (error) {
            console.error(error);
            return res.status(401).json({ msg: 'Token inválido ou expirado' });
        }
    }

    if (!token) {
        return res.status(401).json({ msg: 'Acesso negado, nenhum token fornecido' });
    }
};

// Middleware para checar se o usuário é Admin
exports.checkAdmin = (req, res, next) => {
    // Este middleware deve ser usado *depois* do middleware 'proteger'
    if (req.usuario && req.usuario.tipo === 'admin') {
        next(); // É admin, prossiga
    } else {
        return res.status(403).json({ msg: 'Acesso negado. Requer privilégios de administrador.' });
    }
};

// Middleware para checar se o usuário é Professor, Treinador ou Admin
exports.checkProfessorOrAdmin = (req, res, next) => {
    // Este middleware deve ser usado *depois* do middleware 'proteger'
    if (req.usuario && (
        req.usuario.tipo === 'admin' || 
        req.usuario.tipo === 'professor' || 
        req.usuario.tipo === 'treinador'
    )) {
        next(); // É admin, professor ou treinador, prossiga
    } else {
        return res.status(403).json({ msg: 'Acesso negado. Requer privilégios de Professor ou Administrador.' });
    }
};

// Middleware de proteção OPCIONAL (NOVO)
// Tenta carregar o usuário se o token existir, mas não falha se não existir.
exports.protegerOpcional = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Anexa o usuário (apenas ID e tipo)
            req.usuario = await db.Usuario.findByPk(decoded.id, { attributes: ['id', 'tipo'] });
        } catch (error) {
            // Ignora o erro se o token for inválido/expirado, pois é opcional
            req.usuario = null;
        }
    }
    next(); // Sempre chama next()
};