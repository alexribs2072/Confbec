// --- INÍCIO DO ARQUIVO ---
// /controllers/atletaController.js

const db = require('../models');
// Garante que ambos os modelos sejam importados do db
const { Atleta, Usuario } = db;
// Importa módulos Node.js para lidar com arquivos
const fs = require('fs'); 
const path = require('path'); 

// @desc    Buscar o perfil do atleta logado
// @route   GET /api/atletas/me
// @access  Privado (Apenas o próprio atleta)
exports.getMeuPerfil = async (req, res) => {
    try {
        // Verifica se req.usuario existe (do middleware 'proteger')
        if (!req.usuario) {
             console.error("ERRO FATAL getMeuPerfil: req.usuario não definido!");
             return res.status(500).send('Erro interno: Autenticação falhou.');
        }
        // Busca o perfil do Atleta usando o ID do usuário logado
        const atleta = await Atleta.findOne({
            where: { id: req.usuario.id },
            // Inclui dados associados do Usuario (exceto senha)
            include: [{ 
                model: Usuario,
                as: 'usuario',
                attributes: { exclude: ['senha', 'createdAt', 'updatedAt'] } // Exclui campos desnecessários
            }]
        });

        // Se não encontrar o perfil (pode não ter sido criado ainda)
        if (!atleta) {
            return res.status(404).json({ msg: 'Perfil de atleta não encontrado. Por favor, crie seu perfil.' });
        }

        // Retorna o perfil encontrado
        res.json(atleta);
    } catch (err) {
        console.error("ERRO FATAL em getMeuPerfil:", err); 
        res.status(500).send('Erro no servidor ao buscar perfil.');
    }
};

// @desc    Criar ou atualizar o perfil do atleta logado
// @route   POST /api/atletas/me
// @access  Privado (Apenas o próprio atleta)
exports.createOrUpdateMeuPerfil = async (req, res) => {
    // Pega os dados do corpo da requisição
    const {
        nome_completo, data_nascimento, rg, cpf,
        logradouro, cep, bairro, cidade, estado, telefone_contato
        // Não inclui foto_url aqui, pois é tratada em outra rota
    } = req.body;

    // Verifica se req.usuario existe
    if (!req.usuario) {
        console.error("ERRO FATAL createOrUpdateMeuPerfil: req.usuario não definido!");
        return res.status(500).send('Erro interno: Autenticação falhou.');
    }
    const usuarioId = req.usuario.id; // Pega o ID do usuário logado

    // Validação básica dos campos obrigatórios
    if (!nome_completo || !data_nascimento || !cpf) {
        return res.status(400).json({ msg: 'Nome completo, data de nascimento e CPF são obrigatórios.' });
    }

    try {
        // Procura se já existe um perfil para este usuário
        let atleta = await Atleta.findByPk(usuarioId);

        // Prepara o objeto com os dados a serem salvos/atualizados
        // Garante que o ID seja o do usuário logado
        const dadosDoPerfil = {
            id: usuarioId, nome_completo, data_nascimento, rg: rg || null, cpf, // Define rg como null se vazio
            logradouro: logradouro || null, cep: cep || null, bairro: bairro || null, 
            cidade: cidade || null, estado: estado || null, telefone_contato: telefone_contato || null
            // foto_url não é atualizada aqui
        };

        if (atleta) {
            // Se o perfil existe, ATUALIZA
            console.log(`[atletaController] Atualizando perfil para Atleta ID: ${usuarioId}`);
            await atleta.update(dadosDoPerfil);
            // Retorna o perfil atualizado (o método update não retorna diretamente no Sequelize v6+)
            const atletaAtualizado = await Atleta.findByPk(usuarioId); // Busca novamente para retornar
            res.json(atletaAtualizado); 
        } else {
            // Se o perfil não existe, CRIA
            console.log(`[atletaController] Criando novo perfil para Atleta ID: ${usuarioId}`);
            // Verifica se o CPF já está em uso por OUTRO atleta
            const cpfExistente = await Atleta.findOne({ where: { cpf } });
            if (cpfExistente) {
                console.log(`[atletaController] Erro: CPF ${cpf} já cadastrado.`);
                return res.status(400).json({ msg: 'Este CPF já está cadastrado.' });
            }
            
            // Cria o novo registro na tabela ATLETAS
            atleta = await Atleta.create(dadosDoPerfil);
            res.status(201).json(atleta); // Retorna 201 Created com o novo perfil
        }

    } catch (err) {
        // Captura e trata erros do Sequelize (Validação, Constraint)
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            const msgs = err.errors.map(e => e.message);
            console.error(">>> ERRO Sequelize em createOrUpdateMeuPerfil:", msgs);
            return res.status(400).json({ msg: msgs.join(', ') });
        }
        // Captura outros erros inesperados
        console.error(">>> ERRO FATAL em createOrUpdateMeuPerfil:", err); 
        res.status(500).send('Erro no servidor ao salvar perfil.');
    }
}; // <-- Fim da função createOrUpdateMeuPerfil (SEM chave extra depois)


// --- FUNÇÃO ADICIONADA ---
// @desc    Upload/Atualiza a foto de perfil do atleta logado
// @route   POST /api/atletas/me/foto
// @access  Privado (Atleta)
exports.uploadMinhaFoto = async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] POST /api/atletas/me/foto - INICIO Upload Foto`);
    // Verifica autenticação
    if (!req.usuario) { 
        console.error("ERRO FATAL uploadMinhaFoto: req.usuario não definido!");
        // Apaga arquivo órfão se existir
        if (req.file && req.file.path && fs.existsSync(req.file.path)) { try { fs.unlinkSync(req.file.path); } catch(e){} }
        return res.status(500).send('Erro interno: Autenticação falhou.'); 
    }
    const atletaId = req.usuario.id;

    try {
        // 1. Verifica se o arquivo foi enviado pelo multer (middleware)
        if (!req.file) {
            console.log(">>> Upload Foto falhou: Nenhum arquivo enviado.");
            return res.status(400).json({ msg: 'Nenhum arquivo de foto enviado.' });
        }
        console.log(">>> Arquivo recebido:", req.file.filename);

        // 2. Busca o perfil do atleta no banco (necessário para pegar foto antiga)
        const atleta = await Atleta.findByPk(atletaId);
        if (!atleta) {
            console.log(">>> Upload Foto falhou: Perfil do atleta não encontrado. Apagando arquivo:", req.file.path);
            // Se o perfil não existe, apaga o arquivo órfão que o multer salvou
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ msg: 'Perfil de atleta não encontrado. Crie seu perfil primeiro.' });
        }

        // 3. Deleta a foto antiga do disco (se existir)
        //    Suporta o padrão novo (documentos/<id>/arquivo) e registros legados (apenas filename)
        const fotoAntiga = atleta.foto_url;
        if (fotoAntiga) {
            const candidates = [
                // Caso já esteja no formato novo (ex.: documentos/3/foto-xxx.jpg)
                path.join(__dirname, '../uploads', fotoAntiga),
                // Fallback para registros antigos que guardavam só o filename
                path.join(__dirname, '../uploads/documentos', String(atletaId), fotoAntiga),
            ];

            for (const oldFilePath of candidates) {
                console.log(">>> Tentando deletar foto antiga:", oldFilePath);
                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                        console.log(">>> Foto antiga deletada com sucesso.");
                    } catch (unlinkErr) {
                        console.error(">>> Erro ao deletar foto antiga (continuando...):", unlinkErr);
                    }
                    break;
                }
            }
        }

        // 4. Atualiza o campo foto_url no banco com o caminho RELATIVO (para servir via /api/uploads)
        //    Ex.: documentos/3/foto-xxx.jpg  ->  /api/uploads/documentos/3/foto-xxx.jpg
        const novaFotoUrl = path.posix.join('documentos', String(atletaId), req.file.filename);
        console.log(">>> Atualizando foto_url no DB para:", novaFotoUrl);

        await Atleta.update({ foto_url: novaFotoUrl }, { where: { id: atletaId } });
        console.log(">>> foto_url atualizado com sucesso no DB.");

        console.log(`>>> [${new Date().toISOString()}] POST /api/atletas/me/foto - SUCESSO Upload Foto`);
        // Retorna apenas a URL da nova foto salva
        res.json({ foto_url: novaFotoUrl }); 

    } catch (err) { // Captura qualquer erro
        console.error(`>>> [${new Date().toISOString()}] ERRO FATAL em POST /api/atletas/me/foto:`);
        console.error(err); // Loga o erro completo
        
        // Tenta apagar o arquivo recém-criado se ocorreu erro durante o processo no DB
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); console.log(">>> Arquivo de foto órfão apagado devido a erro:", req.file.path); } 
            catch (unlinkErr) { console.error(">>> Erro ao apagar foto órfã:", unlinkErr); }
        }
        
        // Trata erro específico do multer (ex: tipo de arquivo inválido)
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || (err.message && err.message.includes('Apenas arquivos de imagem'))) {
             return res.status(400).json({ msg: 'Tipo de arquivo inválido. Apenas imagens são permitidas.' });
        }
        // Retorna erro genérico 500
        res.status(500).send('Erro no servidor ao fazer upload da foto.'); 
    }
};
// --- FIM DA FUNÇÃO ADICIONADA ---

// --- FIM DO ARQUIVO --- (Sem chaves extras aqui)
