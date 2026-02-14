// /controllers/authController.js

const db = require('../models');
const Usuario = db.Usuario; // Garante que Usuario está importado
const jwt = require('jsonwebtoken');

// Função para gerar o token JWT (completa)
const gerarToken = (id, tipo) => {
    // Certifique-se de que JWT_SECRET está no seu .env
    if (!process.env.JWT_SECRET) {
        console.error("ERRO FATAL: JWT_SECRET não definido no .env!");
        // Em um app real, você poderia lançar um erro ou sair
        return null; 
    }
    try {
        return jwt.sign({ id, tipo }, process.env.JWT_SECRET, {
            expiresIn: '1d' // Token expira em 1 dia
        });
    } catch (err) {
        console.error("Erro ao gerar token JWT:", err);
        return null;
    }
};

// @desc    Registra um novo usuário (completa e exportada)
// @route   POST /api/auth/registrar
// @access  Público
exports.registrar = async (req, res) => {
    // Log inicial para depuração (pode ser removido depois)
    // console.log(">>> RECEIVED req.body:", req.body); 

    const { email, senha, tipo } = req.body;

    // Validação de entrada básica
    if (!email || !senha) {
        // console.log(">>> VALIDATION FAILED: Email or Senha missing in req.body!"); 
        return res.status(400).json({ msg: 'Por favor, forneça um e-mail e senha.' });
    }

    try {
        // Verifica se o usuário já existe
        let usuario = await Usuario.findOne({ where: { email } });
        if (usuario) {
            // console.log(">>> Email já existe:", email); 
            return res.status(400).json({ msg: 'Usuário já cadastrado com este e-mail' });
        }

        // Cria o novo usuário (hook no modelo cuida do hash da senha)
        usuario = await Usuario.create({
            email,
            senha, // Passa a senha em plain text, o hook faz o hash
            tipo: tipo || 'atleta' // Define 'atleta' como padrão se não for fornecido
        });
        // console.log(">>> Usuário criado com ID:", usuario.id); 

        // Gera o token JWT
        const token = gerarToken(usuario.id, usuario.tipo);
        if (!token) {
             // Se gerarToken falhar por algum motivo
             throw new Error("Falha ao gerar token de autenticação.");
        }

        // Responde com o token (status 201 Created)
        res.status(201).json({ token });

    } catch (err) { // Captura qualquer erro
        // Trata erros de validação específicos do Sequelize
        if (err.name === 'SequelizeValidationError') {
            const msgs = err.errors.map(e => e.message);
            // console.error(">>> Sequelize Validation Error:", msgs); 
            return res.status(400).json({ msg: msgs.join(', ') });
        }
        // Trata erros de constraint (ex: unique)
        if (err.name === 'SequelizeUniqueConstraintError') {
             const msgs = err.errors.map(e => e.message);
             // console.error(">>> Sequelize Unique Constraint Error:", msgs); 
             return res.status(400).json({ msg: 'Erro de constraint: ' + msgs.join(', ') });
        }

        // Log detalhado para qualquer outro erro inesperado
        console.error(">>> ERRO INESPERADO em /api/auth/registrar:", err); 
        res.status(500).send('Erro interno no servidor.'); // Retorna 500 para erros não tratados
    }
};

// @desc    Autentica (login) um usuário (completa e exportada)
// @route   POST /api/auth/login
// @access  Público
exports.login = async (req, res) => {
    // console.log(">>> LOGIN RECEIVED req.body:", req.body);

    const { email, senha } = req.body;

    // Validação de entrada
    if (!email || !senha) {
        // console.log(">>> LOGIN VALIDATION FAILED: Email or Senha missing!");
        return res.status(400).json({ msg: 'Por favor, forneça um e-mail e senha.' });
    }

    try {
        // Encontra o usuário pelo e-mail
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            // Não dê detalhes específicos por segurança
            return res.status(401).json({ msg: 'Credenciais inválidas' }); 
        }

        // Compara a senha enviada com a senha hasheada no banco
        const senhaCorreta = await usuario.compararSenha(senha); // Usa o método do modelo Usuario
        if (!senhaCorreta) {
            return res.status(401).json({ msg: 'Credenciais inválidas' });
        }

        // Gera o token JWT
        const token = gerarToken(usuario.id, usuario.tipo);
         if (!token) {
             throw new Error("Falha ao gerar token de autenticação.");
        }

        // Responde com o token (status 200 OK - padrão)
        res.json({ token });

    } catch (err) {
        console.error(">>> ERRO INESPERADO em /api/auth/login:", err); 
        res.status(500).send('Erro interno no servidor.');
    }
};