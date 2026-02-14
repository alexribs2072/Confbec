const db = require('../models');
const { Modalidade, Graduacao } = db;

// @desc    Criar uma nova modalidade
// @route   POST /api/modalidades
// @access  Privado (Admin)
exports.createModalidade = async (req, res) => {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ msg: 'O nome da modalidade é obrigatório.' });
    }
    try {
        const novaModalidade = await Modalidade.create({ nome });
        res.status(201).json(novaModalidade);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: 'Essa modalidade já está cadastrada.' });
        }
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Listar todas as modalidades (com suas graduações)
// @route   GET /api/modalidades
// @access  Público
exports.getAllModalidades = async (req, res) => {
    try {
        const modalidades = await Modalidade.findAll({
            include: [{
                model: Graduacao,
                as: 'graduacoes',
                attributes: ['id', 'nome', 'restricao_idade', 'ordem']
            }],
            order: [
                ['nome', 'ASC'], // Ordena as modalidades por nome
                [{ model: Graduacao, as: 'graduacoes' }, 'ordem', 'ASC'] // Ordena as graduações por 'ordem'
            ]
        });
        res.json(modalidades);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar uma modalidade
// @route   PUT /api/modalidades/:id
// @access  Privado (Admin)
exports.updateModalidade = async (req, res) => {
    try {
        let modalidade = await Modalidade.findByPk(req.params.id);
        if (!modalidade) {
            return res.status(404).json({ msg: 'Modalidade não encontrada' });
        }
        await modalidade.update(req.body);
        res.json(modalidade);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: 'Esse nome de modalidade já está em uso.' });
        }
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar uma modalidade
// @route   DELETE /api/modalidades/:id
// @access  Privado (Admin)
exports.deleteModalidade = async (req, res) => {
    try {
        const modalidade = await Modalidade.findByPk(req.params.id);
        if (!modalidade) {
            return res.status(404).json({ msg: 'Modalidade não encontrada' });
        }
        // O SQL (ON DELETE CASCADE) cuidará de apagar as graduações
        await modalidade.destroy();
        res.json({ msg: 'Modalidade removida com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};