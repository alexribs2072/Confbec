// /controllers/academiaController.js
const db = require('../models');
// --- GARANTA QUE TODOS OS MODELOS USADOS SÃO IMPORTADOS ---
const { Academia, Federacao, Usuario } = db;
// --------------------------------------------------------

// @desc    Criar uma nova academia
// @route   POST /api/academias
// @access  Privado (Admin)
exports.createAcademia = async (req, res) => {
    // --- LOG INICIAL ---
    console.log(`>>> [${new Date().toISOString()}] POST /api/academias - INICIO`);
    console.log(">>> req.body:", req.body);
    // ------------------

    const { nome, cnpj, email, telefone, logradouro, cep, bairro, cidade, estado, federacao_id, responsavel_id } = req.body;

    try {
        // Validações Essenciais (Nome, Federação, Responsável)
        console.log(">>> Validando campos obrigatórios...");
        if (!nome || !federacao_id || !responsavel_id) {
            console.log(">>> Falha Validação: Campos obrigatórios faltando.");
            return res.status(400).json({ msg: 'Nome, federação e responsável são obrigatórios.' });
        }
        console.log(">>> OK: Campos obrigatórios presentes.");

        // Valida ID da Federação
        console.log(`>>> Validando federacao_id: ${federacao_id}...`);
        const federacao = await Federacao.findByPk(federacao_id);
        if (!federacao) {
            console.log(">>> Falha Validação: Federação não encontrada.");
            return res.status(404).json({ msg: `Federação com ID ${federacao_id} não encontrada.` });
        }
        console.log(">>> OK: Federação encontrada.");

        // Valida ID do Responsável
        console.log(`>>> Validando responsavel_id: ${responsavel_id}...`);
        const responsavel = await Usuario.findByPk(responsavel_id);
        if (!responsavel) {
            console.log(">>> Falha Validação: Responsável não encontrado.");
            return res.status(404).json({ msg: `Usuário responsável com ID ${responsavel_id} não encontrado.` });
        }
         // Opcional: Validar tipo do responsável
         if (!['admin', 'professor', 'treinador'].includes(responsavel.tipo)) {
            console.log(`>>> Falha Validação: Responsável ${responsavel_id} tem tipo inválido (${responsavel.tipo}).`);
            return res.status(400).json({ msg: 'O usuário responsável deve ser admin, professor ou treinador.' });
         }
        console.log(`>>> OK: Responsável encontrado (Tipo: ${responsavel.tipo}).`);
        // Fim das Validações

        // Cria a nova academia
        console.log(">>> Tentando criar Academia no DB...");
        const novaAcademia = await Academia.create({
            nome, cnpj, email, telefone, logradouro, cep, bairro, cidade, estado,
            federacao_id: parseInt(federacao_id, 10), // Garante que seja número
            responsavel_id: parseInt(responsavel_id, 10) // Garante que seja número
        });
        console.log(">>> OK: Academia criada com ID:", novaAcademia.id);

        console.log(`>>> [${new Date().toISOString()}] POST /api/academias - SUCCESS`);
        res.status(201).json(novaAcademia); // Envia resposta

    } catch (err) { // Captura qualquer erro
        // Trata erros específicos do Sequelize
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            const msgs = err.errors.map(e => e.message);
            console.error(">>> Sequelize Error:", msgs);
            return res.status(400).json({ msg: msgs.join(', ') });
        }
        // Loga erros inesperados
        console.error(`>>> [${new Date().toISOString()}] FATAL ERROR in POST /api/academias:`);
        console.error(err);
        res.status(500).send('Erro no servidor ao criar academia.'); // Envia 500
    }
};

// @desc    Listar todas as academias
// @route   GET /api/academias
// @access  Público
exports.getAllAcademias = async (req, res) => {
    try {
        const academias = await Academia.findAll({
            include: [
                { model: Federacao, as: 'federacao', attributes: ['id', 'nome'] },
                { model: Usuario, as: 'responsavel', attributes: ['id', 'nome', 'email', 'tipo'] }
            ],
            order: [['nome', 'ASC']]
        });
        res.json(academias);
    } catch (err) {
        console.error("Erro em getAllAcademias:", err);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Buscar uma academia pelo ID
// @route   GET /api/academias/:id
// @access  Público
exports.getAcademiaById = async (req, res) => {
    try {
        const academia = await Academia.findByPk(req.params.id, {
            include: [
                { model: Federacao, as: 'federacao' },
                { model: Usuario, as: 'responsavel', attributes: { exclude: ['senha'] } }
                // Futuramente: include: [{ model: Filiacao, as: 'filiacoes', include: [Atleta] }]
            ]
        });
        if (!academia) {
            return res.status(404).json({ msg: 'Academia não encontrada' });
        }
        res.json(academia);
    } catch (err) {
        console.error("Erro em getAcademiaById:", err);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar uma academia
// @route   PUT /api/academias/:id
// @access  Privado (Admin)
exports.updateAcademia = async (req, res) => {
    try {
        let academia = await Academia.findByPk(req.params.id);
        if (!academia) {
            return res.status(404).json({ msg: 'Academia não encontrada' });
        }
        // Opcional: Validações antes do update (ex: verificar se federacao_id existe)
        // ...
        await academia.update(req.body);
        res.json(academia); // Retorna a academia atualizada
    } catch (err) {
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            const msgs = err.errors.map(e => e.message);
             console.error(">>> Sequelize Error on Update Academia:", msgs);
            return res.status(400).json({ msg: msgs.join(', ') });
        }
        console.error("Erro em updateAcademia:", err);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar uma academia
// @route   DELETE /api/academias/:id
// @access  Privado (Admin)
exports.deleteAcademia = async (req, res) => {
    try {
        const academia = await Academia.findByPk(req.params.id);
        if (!academia) {
            return res.status(404).json({ msg: 'Academia não encontrada' });
        }
        // A FK na tabela FILIACOES está como ON DELETE RESTRICT, então o destroy() falhará se houver filiações.
        await academia.destroy();
        res.json({ msg: 'Academia removida com sucesso' });
    } catch (err) {
        // Captura o erro se o SQL impedir a exclusão
        if (err.name === 'SequelizeForeignKeyConstraintError') {
             console.error("Erro de FK ao deletar academia:", err);
             return res.status(400).json({ msg: 'Não é possível deletar a academia pois ela possui filiações ativas.' });
        }
        console.error("Erro em deleteAcademia:", err);
        res.status(500).send('Erro no servidor');
    }
};