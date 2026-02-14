const db = require('../models');
const { Noticia, Usuario } = db;

// @desc    Criar uma nova notícia
// @route   POST /api/noticias
// @access  Privado (Admin)
exports.createNoticia = async (req, res) => {
    const { titulo, subtitulo, conteudo, imagem_url } = req.body;
    const autorId = req.usuario.id; // Vem do middleware 'proteger'

    if (!titulo || !conteudo) {
        return res.status(400).json({ msg: 'Título e conteúdo são obrigatórios.' });
    }

    try {
        const noticia = await Noticia.create({
            titulo,
            subtitulo,
            conteudo,
            imagem_url,
            autor_id: autorId,
            publicada_em: new Date()
        });
        res.status(201).json(noticia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Listar todas as notícias (para a Home Page)
// @route   GET /api/noticias
// @access  Público
exports.getAllNoticias = async (req, res) => {
    try {
        const noticias = await Noticia.findAll({
            order: [['publicada_em', 'DESC']], // Mais recentes primeiro
            include: [{
                model: Usuario,
                as: 'autor',
                attributes: ['id'] // TODO: Adicionar 'nome' ao usuário se houver
            }]
        });
        res.json(noticias);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Buscar uma notícia pelo ID
// @route   GET /api/noticias/:id
// @access  Público
exports.getNoticiaById = async (req, res) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id, {
            include: [{
                model: Usuario,
                as: 'autor',
                attributes: ['id'] 
            }]
        });
        if (!noticia) {
            return res.status(404).json({ msg: 'Notícia não encontrada.' });
        }
        res.json(noticia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar uma notícia
// @route   PUT /api/noticias/:id
// @access  Privado (Admin)
exports.updateNoticia = async (req, res) => {
    try {
        let noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).json({ msg: 'Notícia não encontrada.' });
        }
        
        // TODO: Adicionar verificação se o usuário é o autor ou admin
        
        await noticia.update(req.body);
        res.json(noticia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar uma notícia
// @route   DELETE /api/noticias/:id
// @access  Privado (Admin)
exports.deleteNoticia = async (req, res) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).json({ msg: 'Notícia não encontrada.' });
        }
        
        await noticia.destroy();
        res.json({ msg: 'Notícia removida.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};