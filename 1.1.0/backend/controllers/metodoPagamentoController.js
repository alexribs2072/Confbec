// /controllers/metodoPagamentoController.js
const db = require('../models');
const { MetodoPagamento } = db;

// @desc    Criar um novo método de pagamento (Ex: PIX, Boleto)
// @route   POST /api/metodos-pagamento
// @access  Privado (Admin)
exports.createMetodoPagamento = async (req, res) => {
    const { nome, taxa_filiacao, configuracao, ativo } = req.body;

    if (!nome || taxa_filiacao === undefined) {
        return res.status(400).json({ msg: 'Nome e taxa_filiacao são obrigatórios.' });
    }

    try {
        const novoMetodo = await MetodoPagamento.create({
            nome,
            taxa_filiacao,
            configuracao, // Ex: { "chave_pix": "..." } ou { "api_key": "..." }
            ativo: ativo === undefined ? true : ativo
        });
        res.status(201).json(novoMetodo);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Listar todos os métodos de pagamento (Admin ou Público)
// @route   GET /api/metodos-pagamento
// @access  Público
exports.getAllMetodosPagamento = async (req, res) => {
    try {
        // Se for uma requisição de um usuário comum (front-end do atleta),
        // filtramos apenas os métodos ATIVOS.
        let whereClause = {};
        
        // Verifica se quem está acessando é um admin (requisição virá do middleware 'proteger')
        // Se req.usuario não existir, ou não for admin, só mostra os ativos.
        const isAdmin = req.usuario && req.usuario.tipo === 'admin';
        
        if (!isAdmin) {
             whereClause.ativo = true;
        }

        const metodos = await MetodoPagamento.findAll({ where: whereClause });
        
        // Se não for admin, não expomos as chaves de API
        if (!isAdmin) {
            const metodosPublicos = metodos.map(metodo => ({
                id: metodo.id,
                nome: metodo.nome,
                taxa_filiacao: metodo.taxa_filiacao
                // Não expomos o campo 'configuracao'
            }));
            return res.json(metodosPublicos);
        }
        
        res.json(metodos); // Admin vê tudo
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar um método de pagamento
// @route   PUT /api/metodos-pagamento/:id
// @access  Privado (Admin)
exports.updateMetodoPagamento = async (req, res) => {
    try {
        let metodo = await MetodoPagamento.findByPk(req.params.id);
        if (!metodo) {
            return res.status(404).json({ msg: 'Método de pagamento não encontrado.' });
        }
        
        await metodo.update(req.body);
        res.json(metodo);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar um método de pagamento
// @route   DELETE /api/metodos-pagamento/:id
// @access  Privado (Admin)
exports.deleteMetodoPagamento = async (req, res) => {
    try {
        const metodo = await MetodoPagamento.findByPk(req.params.id);
        if (!metodo) {
            return res.status(404).json({ msg: 'Método de pagamento não encontrado.' });
        }
        
        await metodo.destroy();
        res.json({ msg: 'Método de pagamento removido.' });
    } catch (err) {
        // Captura erro de chave estrangeira (se um pagamento depender dele)
        if (err.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ msg: 'Não é possível deletar este método pois ele está vinculado a pagamentos existentes.' });
        }
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};