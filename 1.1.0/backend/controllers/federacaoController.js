// /controllers/federacaoController.js

const db = require('../models'); // Importa o db (models/index.js)
// Garante que TODOS os modelos usados neste controller sejam importados
const { Federacao, Usuario, Academia } = db; 

// @desc    Criar uma nova federação
// @route   POST /api/federacoes
// @access  Privado (Admin)
exports.createFederacao = async (req, res) => {
    // --- LOG INICIAL ---
    console.log(`>>> [${new Date().toISOString()}] POST /api/federacoes - INICIO`);
    console.log(">>> req.body:", req.body);
    // ------------------

    const { nome, cnpj, email, telefone, logradouro, cep, bairro, cidade, estado, representante_id } = req.body;

    // Validação básica
    if (!nome) {
        console.log(">>> Validation Failed: 'nome' is missing.");
        return res.status(400).json({ msg: 'O nome da federação é obrigatório.' });
    }

    try {
        // Opcional: Verificar se o representante_id é um usuário válido
        if (representante_id) {
            console.log(`>>> Checking representante_id: ${representante_id}...`);
            const representante = await Usuario.findByPk(representante_id);
            if (!representante) {
                console.log(`>>> Validation Failed: Representante ID ${representante_id} not found.`);
                // Retorna 404 Not Found se o ID do usuário não existe
                return res.status(404).json({ msg: `Usuário representante com ID ${representante_id} não encontrado` });
            }
            // Validação opcional do tipo de usuário representante (descomente se necessário)
            // if (!['admin', 'professor', 'treinador'].includes(representante.tipo)) {
            //     console.log(`>>> Validation Failed: Representante ID ${representante_id} has invalid type ${representante.tipo}.`);
            //     return res.status(400).json({ msg: 'O usuário representante deve ser admin, professor ou treinador.' });
            // }
            console.log(`>>> OK: Representante ID ${representante_id} found (Tipo: ${representante.tipo}).`);
        } else {
            console.log(">>> No representante_id provided.");
        }

        // Criar a nova federação
        console.log(">>> Attempting to create Federacao in DB...");
        const novaFederacao = await Federacao.create({
            nome, cnpj, email, telefone, logradouro, cep, bairro, cidade, estado,
            // Garante que representante_id seja passado corretamente (null se não fornecido)
            // Usa parseInt para garantir que seja número, se existir
            representante_id: representante_id ? parseInt(representante_id, 10) : null
        });
        console.log(">>> OK: Federacao created with ID:", novaFederacao.id);

        console.log(`>>> [${new Date().toISOString()}] POST /api/federacoes - SUCCESS`);
        res.status(201).json(novaFederacao); // Envia resposta de sucesso

    } catch (err) { // Captura QUALQUER erro durante o processo
        // Trata erros específicos do Sequelize
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            const msgs = err.errors.map(e => e.message);
            console.error(">>> Sequelize Error:", msgs);
            return res.status(400).json({ msg: msgs.join(', ') });
        }
        // Loga erros inesperados
        console.error(`>>> [${new Date().toISOString()}] FATAL ERROR in POST /api/federacoes:`);
        console.error(err); // Loga o objeto de erro completo
        res.status(500).send('Erro no servidor ao criar federação.'); // Envia resposta 500
    }
};

// @desc    Listar todas as federações
// @route   GET /api/federacoes
// @access  Público
exports.getAllFederacoes = async (req, res) => {
    try {
        const federacoes = await Federacao.findAll({
            include: [{
                model: Usuario,
                as: 'representante',
                attributes: ['id', 'nome', 'email', 'tipo'] // Inclui nome
            }],
            order: [['nome', 'ASC']] // Ordena por nome
        });
        res.json(federacoes);
    } catch (err) {
        console.error("Erro em getAllFederacoes:", err);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Buscar uma federação pelo ID
// @route   GET /api/federacoes/:id
// @access  Público
exports.getFederacaoById = async (req, res) => {
    try {
        const federacao = await Federacao.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'representante',
                    attributes: ['id', 'nome', 'email'] // Inclui nome
                },
                {
                    model: Academia, // Precisa importar Academia no topo
                    as: 'academias',
                    attributes: ['id', 'nome']
                }
            ]
        });
        if (!federacao) {
            return res.status(404).json({ msg: 'Federação não encontrada' });
        }
        res.json(federacao);
    } catch (err) {
        console.error("Erro em getFederacaoById:", err);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar uma federação
// @route   PUT /api/federacoes/:id
// @access  Privado (Admin)
exports.updateFederacao = async (req, res) => {
    try {
        let federacao = await Federacao.findByPk(req.params.id);
        if (!federacao) {
            return res.status(404).json({ msg: 'Federação não encontrada' });
        }
        // Opcional: Validações antes do update (ex: verificar se representante_id existe)
        // ...

        // O 'update' só atualiza os campos que vieram no body
        await federacao.update(req.body);
        res.json(federacao); // Retorna a federação atualizada
    } catch (err) {
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            const msgs = err.errors.map(e => e.message);
            console.error(">>> Sequelize Error on Update:", msgs);
            return res.status(400).json({ msg: msgs.join(', ') });
        }
        console.error("Erro em updateFederacao:", err);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar uma federação
// @route   DELETE /api/federacoes/:id
// @access  Privado (Admin)
exports.deleteFederacao = async (req, res) => {
    try {
        const federacao = await Federacao.findByPk(req.params.id);
        if (!federacao) {
            return res.status(404).json({ msg: 'Federação não encontrada' });
        }
        // O SQL (ON DELETE SET NULL na tabela ACADEMIAS) cuidará de desvincular
        await federacao.destroy();
        res.json({ msg: 'Federação removida com sucesso' });
    } catch (err) {
        // Captura erro se houver FK constraint que impeça (ex: ON DELETE RESTRICT)
        if (err.name === 'SequelizeForeignKeyConstraintError') {
             console.error("Erro de FK ao deletar federação:", err);
             return res.status(400).json({ msg: 'Não é possível deletar a federação pois ela possui dependências.' });
        }
        console.error("Erro em deleteFederacao:", err);
        res.status(500).send('Erro no servidor');
    }
};