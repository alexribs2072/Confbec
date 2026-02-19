const db = require('../models');
const { Op } = db.Sequelize;

const {
  CompeticaoEvento,
  CompeticaoModalidade,
  CompeticaoEventoModalidade,
  Modalidade,
  Usuario, 
} = db;

// =========================
// Helpers Internos (Necessários para este controller)
// =========================

async function getEventoOr404(eventoId, res) {
  const evento = await CompeticaoEvento.findByPk(eventoId, {
    include: [{
      model: CompeticaoModalidade,
      as: 'modalidades',
      through: { attributes: ['taxa_inscricao'] }
    }]
  });
  if (!evento) {
    res.status(404).json({ msg: 'Evento não encontrado.' });
    return null;
  }
  return evento;
}

// =========================
// Eventos (Admin / Public)
// =========================

exports.listarEventos = async (req, res) => {
  try {
    const isAdmin = req.usuario?.tipo === 'admin';
    const where = {};

    if (!isAdmin) {
      where.status = { [Op.notIn]: ['RASCUNHO', 'CANCELADO'] };
    }

    const eventos = await CompeticaoEvento.findAll({
      where,
      order: [['data_evento', 'DESC']],
      include: [
        {
          model: CompeticaoModalidade,
          as: 'modalidades',
          through: { attributes: ['taxa_inscricao'] }
        },
        {
          model: Modalidade,
          as: 'modalidade',
          attributes: ['id', 'nome']
        }
      ]
    });

    res.json(eventos);
  } catch (err) {
    console.error('Erro ao listar eventos:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.getEvento = async (req, res) => {
  try {
    const evento = await getEventoOr404(req.params.eventoId, res);
    if (!evento) return;

    const isAdmin = req.usuario?.tipo === 'admin';
    if (!isAdmin && ['RASCUNHO', 'CANCELADO'].includes(evento.status)) {
      return res.status(404).json({ msg: 'Evento não encontrado.' });
    }

    res.json(evento);
  } catch (err) {
    console.error('Erro ao obter evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.criarEvento = async (req, res) => {
  try {
    const { 
      modalidade_id, 
      nome, descricao, local, escopo, data_evento, data_fim, status, taxa_inscricao 
    } = req.body;

    if (!nome || !data_evento) {
      return res.status(400).json({ msg: 'Campos obrigatórios: nome, data_evento.' });
    }

    const evento = await CompeticaoEvento.create({
      modalidade_id: modalidade_id ? Number(modalidade_id) : null,
      nome,
      descricao: descricao ?? null,
      local: local ?? null,
      escopo: escopo ?? 'MUNICIPAL',
      data_evento,
      data_fim: data_fim ?? null,
      status: status ?? 'RASCUNHO',
      taxa_inscricao: taxa_inscricao ?? 0,
    });

    res.status(201).json(evento);
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarEvento = async (req, res) => {
  try {
    const evento = await CompeticaoEvento.findByPk(req.params.eventoId);
    if (!evento) return res.status(404).json({ msg: 'Evento não encontrado.' });

    const allowed = [
      'modalidade_id',
      'nome', 'descricao', 'local', 'escopo', 'data_evento', 'data_fim', 'status', 'taxa_inscricao'
    ];
    
    const patch = {};
    for (const k of allowed) {
      if (k in (req.body || {})) {
        patch[k] = req.body[k];
      }
    }

    await evento.update(patch);
    res.json(evento);
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.excluirEvento = async (req, res) => {
  try {
    const evento = await CompeticaoEvento.findByPk(req.params.eventoId);
    if (!evento) return res.status(404).json({ msg: 'Evento não encontrado.' });

    if (evento.status === 'CANCELADO') {
      return res.json({ msg: 'Evento já está cancelado.', evento });
    }

    await evento.update({ status: 'CANCELADO' });
    return res.json({ msg: 'Evento cancelado com sucesso.', evento });
  } catch (err) {
    console.error('Erro ao cancelar evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarModalidadesDoEvento = async (req, res) => {
  try {
    const evento = await CompeticaoEvento.findByPk(req.params.eventoId);
    if (!evento) return res.status(404).json({ msg: 'Evento não encontrado.' });

    const body = req.body || {};
    const modalidadesPayload = Array.isArray(body.modalidades)
      ? body.modalidades
      : (Array.isArray(body.competicao_modalidade_ids)
          ? body.competicao_modalidade_ids.map((id) => ({ id, taxa_inscricao: 0 }))
          : null);

    if (!Array.isArray(modalidadesPayload)) {
      return res.status(400).json({ msg: 'Informe modalidades (array de {id, taxa_inscricao}) ou competicao_modalidade_ids (array).' });
    }

    const ids = modalidadesPayload.map(m => m?.id).filter(Boolean);
    if (ids.length === 0) {
      await CompeticaoEventoModalidade.destroy({ where: { evento_id: evento.id } });
    } else {
      const modalidades = await CompeticaoModalidade.findAll({ where: { id: { [Op.in]: ids } } });
      if (modalidades.length !== ids.length) {
        return res.status(400).json({ msg: 'Uma ou mais modalidades informadas são inválidas.' });
      }

      await CompeticaoEventoModalidade.destroy({ where: { evento_id: evento.id } });

      const rows = modalidadesPayload.map((m) => ({
        evento_id: evento.id,
        competicao_modalidade_id: Number(m.id),
        taxa_inscricao: Number(m.taxa_inscricao ?? 0),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await CompeticaoEventoModalidade.bulkCreate(rows);
    }

    const refreshed = await CompeticaoEvento.findByPk(evento.id, {
      include: [{ model: CompeticaoModalidade, as: 'modalidades', through: { attributes: ['taxa_inscricao'] } }]
    });
    res.json(refreshed);
  } catch (err) {
    console.error('Erro ao atualizar modalidades do evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Modalidades (Admin)
// =========================

exports.listarModalidades = async (req, res) => {
  try {
    const modalidades = await CompeticaoModalidade.findAll({
      order: [['nome', 'ASC']],
      include: [{ model: Modalidade, as: 'modalidadeFiliacao', attributes: ['id', 'nome'] }]
    });
    res.json(modalidades);
  } catch (err) {
    console.error('Erro ao listar modalidades de competição:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarModalidade = async (req, res) => {
  try {
    const mod = await CompeticaoModalidade.findByPk(req.params.modalidadeId);
    if (!mod) return res.status(404).json({ msg: 'Modalidade de competição não encontrada.' });

    const allowed = ['nome', 'tipo', 'ativo', 'filiacao_modalidade_id'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    await mod.update(patch);
    res.json(mod);
  } catch (err) {
    console.error('Erro ao atualizar modalidade de competição:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Submodalidades / CompeticaoModalidade CRUD (Admin)
// =========================

exports.listarSubmodalidades = async (req, res) => {
  try {
    const { modalidade_id, ativo, q } = req.query;

    const where = {};
    if (modalidade_id) where.modalidade_id = Number(modalidade_id);
    if (ativo !== undefined) where.ativo = String(ativo) === 'true' || String(ativo) === '1';
    if (q) where.nome = { [Op.like]: `%${q}%` };

    const data = await CompeticaoModalidade.findAll({
      where,
      order: [['nome', 'ASC']],
    });

    return res.json(data);
  } catch (err) {
    console.error('Erro ao listar submodalidades:', err);
    return res.status(500).json({ msg: 'Erro ao listar submodalidades.' });
  }
};

exports.criarSubmodalidade = async (req, res) => {
  try {
    const { modalidade_id, code, nome, tipo, ativo } = req.body || {};
    if (!modalidade_id || !code || !nome || !tipo) {
      return res.status(400).json({ msg: 'Campos obrigatórios: modalidade_id, code, nome, tipo.' });
    }

    const created = await CompeticaoModalidade.create({
      modalidade_id: Number(modalidade_id),
      code,
      nome,
      tipo,
      ativo: ativo === undefined ? true : !!ativo,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error('Erro ao criar submodalidade:', err);
    return res.status(500).json({ msg: 'Erro ao criar submodalidade.' });
  }
};

exports.atualizarSubmodalidade = async (req, res) => {
  try {
    const { submodalidadeId } = req.params;

    const item = await CompeticaoModalidade.findByPk(submodalidadeId);
    if (!item) return res.status(404).json({ msg: 'Submodalidade não encontrada.' });

    const allowed = ['modalidade_id', 'code', 'nome', 'tipo', 'ativo'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    if (patch.modalidade_id !== undefined) patch.modalidade_id = Number(patch.modalidade_id);

    await item.update(patch);
    return res.json(item);
  } catch (err) {
    console.error('Erro ao atualizar submodalidade:', err);
    return res.status(500).json({ msg: 'Erro ao atualizar submodalidade.' });
  }
};

exports.excluirSubmodalidade = async (req, res) => {
  try {
    const { submodalidadeId } = req.params;

    const item = await CompeticaoModalidade.findByPk(submodalidadeId);
    if (!item) return res.status(404).json({ msg: 'Submodalidade não encontrada.' });

    await item.destroy();
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir submodalidade:', err);
    return res.status(500).json({ msg: 'Erro ao excluir submodalidade.' });
  }
};