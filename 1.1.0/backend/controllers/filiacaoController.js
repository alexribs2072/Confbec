// --- INÍCIO DO ARQUIVO ---
// /controllers/filiacaoController.js

const db = require('../models');
// Garante importação correta de TODOS os modelos usados e Op
const { Filiacao, Atleta, Academia, Modalidade, Graduacao, Usuario, Documento } = db;
const { Op } = require('sequelize');

// @desc    Criar uma nova filiação (Ação do Atleta)
// @route   POST /api/filiacoes
// @access  Privado (Atleta)
exports.createFiliacao = async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] POST /api/filiacoes - INICIO`); // Log
    const { academia_id, modalidade_id, graduacao_id, professor_id } = req.body;
    if (!req.usuario) { console.error("ERRO FATAL createFiliacao: req.usuario não definido!"); return res.status(500).send('Erro interno: Autenticação falhou.'); }
    const atletaId = req.usuario.id;

    try {
        if (req.usuario.tipo !== 'atleta') { return res.status(403).json({ msg: 'Apenas atletas podem criar filiações.' }); }
        const atleta = await Atleta.findByPk(atletaId);
        if (!atleta) { return res.status(400).json({ msg: 'Você deve criar seu perfil de atleta antes de se filiar.' }); }
        const [academia, modalidade, graduacao, professor] = await Promise.all([ Academia.findByPk(academia_id), Modalidade.findByPk(modalidade_id), Graduacao.findByPk(graduacao_id), Usuario.findByPk(professor_id) ]);
        if (!academia) return res.status(404).json({ msg: 'Academia não encontrada.' });
        if (!modalidade) return res.status(404).json({ msg: 'Modalidade não encontrada.' });
        if (!graduacao) return res.status(404).json({ msg: 'Graduação não encontrada.' });
        if (!professor || (professor.tipo !== 'professor' && professor.tipo !== 'treinador')) { return res.status(404).json({ msg: 'Professor/Treinador responsável não encontrado ou inválido.' }); }
        const filiacaoExistente = await Filiacao.findOne({ where: { atleta_id: atletaId, modalidade_id: modalidade_id, status: { [Op.in]: ['ativo', 'pendente_documentos', 'pendente_aprovacao_docs', 'pendente_aprovacao_professor', 'pendente_pagamento'] } } });
        if (filiacaoExistente) { return res.status(400).json({ msg: `Você já possui uma filiação ${filiacaoExistente.status} para esta modalidade.` }); }
        const novaFiliacao = await Filiacao.create({ atleta_id: atletaId, academia_id, modalidade_id, graduacao_id, professor_id, status: 'pendente_documentos', data_solicitacao: new Date() });
        console.log(`>>> [${new Date().toISOString()}] POST /api/filiacoes - SUCESSO`); // Log
        res.status(201).json(novaFiliacao);
    } catch (err) { console.error(`>>> ERRO FATAL em POST /api/filiacoes:`, err); res.status(500).send('Erro no servidor ao criar filiação.'); }
};

// @desc    Buscar minhas filiações (do atleta logado)
// @route   GET /api/filiacoes/me
// @access  Privado (Atleta)
exports.getMinhasFiliacoes = async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/me - INICIO`); // Log
    if (!req.usuario) { console.error("ERRO FATAL getMinhasFiliacoes: req.usuario não definido!"); return res.status(500).send('Erro interno: Autenticação falhou.'); }
    try {
        const filiacoes = await Filiacao.findAll({
            where: { atleta_id: req.usuario.id },
            include: [
                { model: Academia, as: 'academia', attributes: ['nome'] },
                { model: Modalidade, as: 'modalidade', attributes: ['nome'] },
                { model: Graduacao, as: 'graduacao', attributes: ['nome'] },
                { model: Usuario, as: 'professorResponsavel', attributes: ['id', 'nome', 'email'] }
            ],
            order: [['data_solicitacao', 'DESC']]
        });
        console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/me - SUCESSO`); // Log
        res.json(filiacoes);
    } catch (err) { console.error(`>>> ERRO FATAL em GET /api/filiacoes/me:`, err); res.status(500).send('Erro no servidor'); }
};

// @desc    Buscar filiações PENDENTES DE DOCUMENTOS (para Admin)
// @route   GET /api/filiacoes/pendentes-docs
// @access  Privado (Admin)
exports.getFiliacoesPendentesDocs = async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/pendentes-docs - INICIO (Admin Check)`); // Log
    try {
        const filiacoes = await Filiacao.findAll({
            where: { status: 'pendente_aprovacao_docs' },
            include: [
                { model: Atleta, as: 'atleta', attributes: ['nome_completo', 'cpf'] },
                { model: Academia, as: 'academia', attributes: ['nome'] },
                { model: Modalidade, as: 'modalidade', attributes: ['nome'] },
                { model: Usuario, as: 'professorResponsavel', attributes: ['id', 'nome', 'email'] }
            ],
            order: [['data_solicitacao', 'ASC']]
        });
        console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/pendentes-docs - SUCESSO (${filiacoes.length})`); // Log
        res.json(filiacoes);
    } catch (err) { console.error(`>>> ERRO FATAL em GET /api/filiacoes/pendentes-docs:`, err); res.status(500).send('Erro no servidor'); }
};

// @desc    Buscar filiações PENDENTES DE APROVAÇÃO DO PROFESSOR (para Professor/Admin)
// @route   GET /api/filiacoes/pendentes-professor
// @access  Privado (Professor/Admin)
exports.getFiliacoesPendentesProfessor = async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/pendentes-professor - INICIO`); // Log
    if (!req.usuario) { console.error("ERRO FATAL getFiliacoesPendentesProfessor: req.usuario não definido!"); return res.status(500).send('Erro interno: Autenticação falhou.'); }
    try {
        let whereClause = { status: 'pendente_aprovacao_professor' };
        if (req.usuario.tipo === 'professor' || req.usuario.tipo === 'treinador') {
             whereClause.professor_id = req.usuario.id;
        }
        const filiacoes = await Filiacao.findAll({
            where: whereClause,
            include: [
                { model: Atleta, as: 'atleta', attributes: ['nome_completo', 'cpf'] },
                { model: Academia, as: 'academia', attributes: ['nome'] },
                { model: Modalidade, as: 'modalidade', attributes: ['nome'] }
            ],
            order: [['data_solicitacao', 'ASC']]
        });
        console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/pendentes-professor - SUCESSO (${filiacoes.length})`); // Log
        res.json(filiacoes);
    } catch (err) { console.error(`>>> ERRO FATAL em GET /api/filiacoes/pendentes-professor:`, err); res.status(500).send('Erro no servidor'); }
};

// @desc    Atleta submete documentos para análise do Admin
// @route   PUT /api/filiacoes/:id/submeter-docs
// @access  Privado (Atleta dono)
exports.submeterDocumentosFiliacao = async (req, res) => {
    const filiacaoId = req.params.id;
    console.log(`>>> [${new Date().toISOString()}] PUT /api/filiacoes/${filiacaoId}/submeter-docs - INICIO`);
    if (!req.usuario) { console.error("ERRO FATAL submeterDocumentosFiliacao: req.usuario não definido!"); return res.status(500).send('Erro interno: Autenticação falhou.'); }
    const atletaId = req.usuario.id;
    try {
        const filiacao = await Filiacao.findOne({ where: { id: filiacaoId, atleta_id: atletaId }, include: [{ model: Documento, as: 'documentos', attributes: ['id']}] });
        if (!filiacao) { return res.status(404).json({ msg: 'Filiação não encontrada ou não pertence a você.' }); }
        if (filiacao.status !== 'pendente_documentos') { return res.status(400).json({ msg: `Não é possível submeter documentos no status atual (${filiacao.status}).` }); }
        if (!filiacao.documentos || filiacao.documentos.length === 0) { return res.status(400).json({ msg: 'Você precisa enviar pelo menos um documento.' }); }
        await filiacao.update({ status: 'pendente_aprovacao_docs' });
        const filiacaoAtualizada = await Filiacao.findByPk(filiacaoId);
        res.json(filiacaoAtualizada);
    } catch (err) { console.error(`>>> ERRO FATAL em PUT /api/filiacoes/${filiacaoId}/submeter-docs:`, err); res.status(500).send('Erro no servidor ao submeter documentos.'); }
};

// @desc    Admin finaliza revisão de documentos (aprova ou rejeita)
// @route   PUT /api/filiacoes/:id/revisar-docs
// @access  Privado (Admin)
exports.revisarDocumentosFiliacao = async (req, res) => {
    const filiacaoId = req.params.id;
    const { aprovado } = req.body;
    console.log(`>>> [${new Date().toISOString()}] PUT /api/filiacoes/${filiacaoId}/revisar-docs - INICIO (aprovado=${aprovado})`);
    if (aprovado === undefined) { return res.status(400).json({ msg: 'Campo "aprovado" (true/false) é obrigatório.' }); }
    try {
        const filiacao = await Filiacao.findByPk(filiacaoId, { include: [{ model: Documento, as: 'documentos' }] });
        if (!filiacao) return res.status(404).json({ msg: 'Filiação não encontrada.' });
        if (filiacao.status !== 'pendente_aprovacao_docs') { return res.status(400).json({ msg: `Ação inválida para o status atual (${filiacao.status}).` }); }
        let novoStatus;
        if (aprovado) {
            const todosDocsAprovados = filiacao.documentos.length > 0 && filiacao.documentos.every(doc => doc.status === 'aprovado');
            if (!todosDocsAprovados) { return res.status(400).json({ msg: 'Não é possível aprovar. Nem todos os documentos foram marcados como "aprovado".' }); }
            novoStatus = 'pendente_aprovacao_professor';
        } else { novoStatus = 'rejeitado'; }
        await filiacao.update({ status: novoStatus });
        res.json(filiacao);
    } catch (err) { console.error(`>>> ERRO FATAL em PUT /api/filiacoes/${filiacaoId}/revisar-docs:`, err); res.status(500).send('Erro no servidor'); }
};

// @desc    Professor/Admin aprova ou rejeita o VÍNCULO do atleta
// @route   PUT /api/filiacoes/:id/revisar-vinculo
// @access  Privado (Professor/Admin)
exports.revisarVinculoFiliacao = async (req, res) => {
    const filiacaoId = req.params.id;
    const { aprovado } = req.body;
    console.log(`>>> [${new Date().toISOString()}] PUT /api/filiacoes/${filiacaoId}/revisar-vinculo - INICIO (aprovado=${aprovado})`);
    if (!req.usuario) { console.error("ERRO FATAL revisarVinculoFiliacao: req.usuario não definido!"); return res.status(500).send('Erro interno: Autenticação falhou.'); }
    if (aprovado === undefined) { return res.status(400).json({ msg: 'Campo "aprovado" (true/false) é obrigatório.' }); }
    try {
        const filiacao = await Filiacao.findByPk(filiacaoId);
        if (!filiacao) return res.status(404).json({ msg: 'Filiação não encontrada.' });
        if (filiacao.status !== 'pendente_aprovacao_professor') { return res.status(400).json({ msg: `Ação inválida para o status atual (${filiacao.status}).` }); }
        const isAdmin = req.usuario.tipo === 'admin';
        const isProfessorResponsavel = filiacao.professor_id === req.usuario.id;
        if (!isAdmin && !isProfessorResponsavel) { return res.status(403).json({ msg: 'Você não tem permissão para aprovar/rejeitar este vínculo.' }); }
        let novoStatus; let dadosUpdate = {};
        if (aprovado) {
            novoStatus = 'pendente_pagamento';
            const hoje = new Date();
            dadosUpdate.data_aprovacao = hoje;
            dadosUpdate.data_vencimento = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        } else { novoStatus = 'rejeitado'; }
        dadosUpdate.status = novoStatus;
        await filiacao.update(dadosUpdate);
        res.json(filiacao);
    } catch (err) { console.error(`>>> ERRO FATAL em PUT /api/filiacoes/${filiacaoId}/revisar-vinculo:`, err); res.status(500).send('Erro no servidor'); }
};

// @desc    Buscar uma filiação pelo ID
// @route   GET /api/filiacoes/:id
// @access  Privado (Admin/Professor responsável/Atleta dono)
exports.getFiliacaoById = async (req, res) => {
    const filiacaoId = req.params.id;
    console.log(`>>> [${new Date().toISOString()}] GET /api/filiacoes/${filiacaoId} - INICIO`);
    if (!req.usuario) { console.error("ERRO FATAL getFiliacaoById: req.usuario não definido!"); return res.status(500).send('Erro interno: Autenticação falhou.'); }
    try {
        const filiacao = await Filiacao.findByPk(filiacaoId, {
            include: [
                // Inclui foto_url para o front montar /api/uploads/${foto_url}
                { model: Atleta, as: 'atleta', attributes: ['id', 'nome_completo', 'cpf', 'foto_url'] },
                { model: Academia, as: 'academia', attributes: ['id', 'nome'] },
                { model: Modalidade, as: 'modalidade', attributes: ['id', 'nome'] },
                { model: Graduacao, as: 'graduacao', attributes: ['id', 'nome'] },
                { model: Usuario, as: 'professorResponsavel', attributes: ['id', 'nome', 'email'] },
                { model: Documento, as: 'documentos' }
            ]
        });
        if (!filiacao) return res.status(404).json({ msg: 'Filiação não encontrada.' });

        const isAdmin = req.usuario.tipo === 'admin';
        const isProfessorResponsavel = filiacao.professor_id === req.usuario.id;
        const isOwner = filiacao.atleta_id === req.usuario.id;

        if (!isAdmin && !isProfessorResponsavel && !isOwner) { return res.status(403).json({ msg: 'Acesso negado.' }); }

        res.json(filiacao);
    } catch (err) { console.error(`>>> ERRO FATAL em GET /api/filiacoes/${filiacaoId}:`, err); res.status(500).send('Erro no servidor'); }
};

// --- FIM DO ARQUIVO ---
