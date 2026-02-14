// --- INÍCIO DO ARQUIVO ---
// /controllers/documentoController.js

const db = require('../models');
// Garante importação correta dos modelos e módulos Node
const { Documento, Filiacao } = db; 
const path = require('path');
const fs = require('fs');

// @desc    Fazer upload de um documento para uma filiação
// @route   POST /api/documentos/upload/:filiacaoId
// @access  Privado (Atleta)
exports.uploadDocumento = async (req, res) => {
    // --- Log inicial ---
    console.log(`[${new Date().toISOString()}] POST /api/documentos/upload/${req.params.filiacaoId} - INICIO Upload`);
    console.log(">>> req.file:", req.file);
    console.log(">>> req.body:", req.body);
    // ------------------
    try {
        const filiacaoId = req.params.filiacaoId;
        
        // Verifica autenticação
        if (!req.usuario) {
             console.error("ERRO FATAL Upload: req.usuario não definido!"); 
             // Tenta apagar arquivo órfão
             if (req.file && req.file.path && fs.existsSync(req.file.path)) { try { fs.unlinkSync(req.file.path); } catch(e){} }
             return res.status(500).send('Erro interno: Autenticação falhou.');
        }
        const atletaId = req.usuario.id;

        // Verifica se arquivo foi enviado
        if (!req.file) {
            console.log(">>> Upload falhou: Nenhum arquivo enviado.");
            return res.status(400).json({ msg: 'Nenhum arquivo enviado.' });
        }
        
        // Verifica se tipo foi enviado
        const { tipo_documento } = req.body;
        if (!tipo_documento) {
            console.log(">>> Upload falhou: Tipo de documento faltando. Apagando arquivo:", req.file.path);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Apaga arquivo órfão
            return res.status(400).json({ msg: 'O tipo do documento é obrigatório.' });
        }
        
        // Verifica se filiação pertence ao atleta
        const filiacao = await Filiacao.findOne({ where: { id: filiacaoId, atleta_id: atletaId } });
        if (!filiacao) {
            console.log(">>> Upload falhou: Filiação não encontrada/pertence. Apagando arquivo:", req.file.path);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Apaga arquivo órfão
            return res.status(404).json({ msg: 'Filiação não encontrada ou não pertence a este atleta.' });
        }
        
        // Cria registro no banco
        console.log(">>> Criando registro do documento no DB...");
        // Salva no DB o caminho RELATIVO para servir via /api/uploads
        // Ex.: documentos/3/documento-xxx.pdf  -> /api/uploads/documentos/3/documento-xxx.pdf
        const caminhoRelativo = path.posix.join('documentos', String(atletaId), req.file.filename);

        const novoDocumento = await Documento.create({
            filiacao_id: filiacaoId,
            tipo_documento: tipo_documento,
            url_arquivo: caminhoRelativo,
            nome_original: req.file.originalname,
            status: 'pendente'
        });
        console.log(">>> Documento criado no DB com ID:", novoDocumento.id);

        console.log(`>>> [${new Date().toISOString()}] POST /api/documentos/upload/${filiacaoId} - SUCESSO Upload`);
        res.status(201).json(novoDocumento);

    } catch (err) {
        console.error(`>>> [${new Date().toISOString()}] ERRO FATAL em POST /api/documentos/upload/${req.params.filiacaoId}:`);
        console.error(err);
        
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); console.log(">>> Arquivo órfão apagado devido a erro:", req.file.path); } 
            catch (unlinkErr) { console.error(">>> Erro ao tentar apagar arquivo órfão:", unlinkErr); }
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || (err.message && err.message.includes('Apenas arquivos de imagem'))) {
             return res.status(400).json({ msg: 'Tipo de arquivo inválido. Apenas imagens ou PDFs são permitidos.' });
        }
        
        res.status(500).send('Erro no servidor durante o upload do documento.');
    }
};

// @desc    Listar documentos de uma filiação
// @route   GET /api/documentos/:filiacaoId
// @access  Privado (Atleta dono, Professor responsável, ou Admin)
exports.getDocumentosPorFiliacao = async (req, res) => {
    try {
        const filiacaoId = req.params.filiacaoId;
        if (!req.usuario) {
             console.error("ERRO FATAL GetDocs: req.usuario não definido!"); 
             return res.status(500).send('Erro interno: Autenticação falhou.');
        }
        
        const filiacao = await Filiacao.findByPk(filiacaoId);
        if (!filiacao) {
            console.log(">>> GetDocs falhou: Filiação não encontrada:", filiacaoId);
            return res.status(404).json({ msg: 'Filiação não encontrada.' });
        }

        const isOwner = filiacao.atleta_id === req.usuario.id;
        const isAdmin = req.usuario.tipo === 'admin';
        const isProfessorResponsavel = filiacao.professor_id === req.usuario.id; 
        
        console.log(`[GetDocs] Permissões para filiacao ${filiacaoId}: isOwner=${isOwner}, isAdmin=${isAdmin}, isProfessor=${isProfessorResponsavel} (User ID=${req.usuario.id}, Prof ID=${filiacao.professor_id})`);

        if (!isOwner && !isAdmin && !isProfessorResponsavel) {
            console.log("[GetDocs] Acesso negado.");
            return res.status(403).json({ msg: 'Você não tem permissão para ver estes documentos.' });
        }
        
        const documentos = await Documento.findAll({
            where: { filiacao_id: filiacaoId },
            include: [{ 
                model: Filiacao, 
                as: 'filiacao', 
                attributes: ['atleta_id']
            }],
            order: [['createdAt', 'ASC']]
        });
        
        res.json(documentos);

    } catch (err) {
        console.error(`ERRO FATAL em GET /api/documentos/${req.params.filiacaoId}:`, err); 
        res.status(500).send('Erro no servidor ao buscar documentos.');
    }
};

// @desc    Atualizar status de um documento (Aprovar/Rejeitar) - APENAS ADMIN
// @route   PUT /api/documentos/:documentoId/status
// @access  Privado (Admin)
exports.updateStatusDocumento = async (req, res) => {
    try {
        const documentoId = req.params.documentoId;
        const { status } = req.body;
        
        if (!req.usuario) {
             console.error("ERRO FATAL UpdateStatusDoc: req.usuario não definido!");
             return res.status(500).send('Erro interno: Autenticação falhou.');
        }
        if (req.usuario.tipo !== 'admin') {
             console.log(">>> UpdateStatusDoc falhou: Acesso negado (não é Admin). Usuário:", req.usuario.id, req.usuario.tipo);
             return res.status(403).json({ msg: 'Apenas administradores podem aprovar/rejeitar documentos.' });
        }

        if (!status || (status !== 'aprovado' && status !== 'rejeitado')) {
            console.log(">>> UpdateStatusDoc falhou: Status inválido:", status);
            return res.status(400).json({ msg: 'Status inválido. Use "aprovado" ou "rejeitado".' });
        }
        
        const documento = await Documento.findByPk(documentoId);
        if (!documento) {
            console.log(">>> UpdateStatusDoc falhou: Documento não encontrado:", documentoId);
            return res.status(404).json({ msg: 'Documento não encontrado.' });
        }

        await documento.update({ status });
        res.json(documento);

    } catch (err) {
        console.error(`ERRO FATAL em PUT /api/documentos/${req.params.documentoId}/status:`, err); 
        res.status(500).send('Erro no servidor ao atualizar status do documento.');
    }
};

// @desc    Deletar um documento
// @route   DELETE /api/documentos/:documentoId
// @access  Privado (Atleta dono ou Admin)
exports.deleteDocumento = async (req, res) => {
     try {
        const documentoId = req.params.documentoId;
        if (!req.usuario) {
             console.error("ERRO FATAL DeleteDoc: req.usuario não definido!"); 
             return res.status(500).send('Erro interno: Autenticação falhou.');
        }
        
        const documento = await Documento.findByPk(documentoId, {
             include: { model: Filiacao, as: 'filiacao', attributes: ['atleta_id'] }
        });
        if (!documento) {
            console.log(">>> Delete falhou: Documento não encontrado:", documentoId);
            return res.status(404).json({ msg: 'Documento não encontrado.' });
        }

        const isAdmin = req.usuario.tipo === 'admin';
        const isOwner = documento.filiacao.atleta_id === req.usuario.id;

        if (!isAdmin && !isOwner) {
            console.log(">>> Delete falhou: Acesso negado.");
            return res.status(403).json({ msg: 'Você não tem permissão para deletar este documento.' });
        }

        // Deleta o arquivo do disco (novo padrão + legado)
        const candidates = [
            path.join(__dirname, '../uploads', documento.url_arquivo),
        ];

        if (documento.url_arquivo && !documento.url_arquivo.includes('/') && !documento.url_arquivo.includes('\\')) {
            candidates.push(
                path.join(__dirname, '../uploads/documentos', String(documento.filiacao.atleta_id), documento.url_arquivo)
            );
        }

        let deletedFromDisk = false;
        for (const filePath of candidates) {
            console.log(">>> Tentando deletar arquivo do disco:", filePath);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(">>> Arquivo deletado do disco.");
                    deletedFromDisk = true;
                    break;
                } catch (unlinkErr) {
                    console.error(">>> Erro ao deletar arquivo do disco:", unlinkErr);
                }
            }
        }
        if (!deletedFromDisk) {
            console.warn(">>> Arquivo não encontrado no disco para deletar (candidates):", candidates);
        }

        await documento.destroy();
        res.json({ msg: 'Documento removido com sucesso.' });

     } catch (err) {
        console.error(`ERRO FATAL em DELETE /api/documentos/${req.params.documentoId}:`, err); 
        res.status(500).send('Erro no servidor ao deletar documento.');
     }
};
// --- FIM DO ARQUIVO ---
