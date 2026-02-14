const db = require('../models');
const { Graduacao, Modalidade } = db;

// @desc    Criar uma nova graduação (faixa/grau)
// @route   POST /api/graduacoes
// @access  Privado (Admin)
exports.createGraduacao = async (req, res) => {
    const { nome, modalidade_id, restricao_idade, ordem } = req.body;
    
    if (!nome || !modalidade_id) {
        return res.status(400).json({ msg: 'Nome e modalidade_id são obrigatórios.' });
    }
    
    try {
        // Valida se a modalidade existe
        const modalidade = await Modalidade.findByPk(modalidade_id);
        if (!modalidade) {
            return res.status(404).json({ msg: 'Modalidade não encontrada.' });
        }
        
        const novaGraduacao = await Graduacao.create({
            nome,
            modalidade_id,
            restricao_idade,
            ordem
        });
        res.status(201).json(novaGraduacao);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Listar todas as graduações (ou filtrar por modalidade)
// @route   GET /api/graduacoes
// @access  Público
exports.getAllGraduacoes = async (req, res) => {
    try {
        let options = {
            include: [{ model: Modalidade, as: 'modalidade', attributes: ['id', 'nome'] }],
            order: [['ordem', 'ASC']]
        };
        
        // Permite filtrar por modalidade (ex: /api/graduacoes?modalidade_id=1)
        if (req.query.modalidade_id) {
            options.where = { modalidade_id: req.query.modalidade_id };
        }
        
        const graduacoes = await Graduacao.findAll(options);
        res.json(graduacoes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar uma graduação
// @route   PUT /api/graduacoes/:id
// @access  Privado (Admin)
exports.updateGraduacao = async (req, res) => {
    try {
        let graduacao = await Graduacao.findByPk(req.params.id);
        if (!graduacao) {
            return res.status(404).json({ msg: 'Graduação não encontrada' });
        }
        await graduacao.update(req.body);
        res.json(graduacao);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar uma graduação
// @route   DELETE /api/graduacoes/:id
// @access  Privado (Admin)
exports.deleteGraduacao = async (req, res) => {
    try {
        const graduacao = await Graduacao.findByPk(req.params.id);
        if (!graduacao) {
            return res.status(404).json({ msg: 'Graduação não encontrada' });
        }
        await graduacao.destroy();
        res.json({ msg: 'Graduação removida com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};