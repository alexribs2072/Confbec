const db = require('../models');
const { Op } = require('sequelize');

const {
  Usuario,
  Atleta,
  Graduacao,
  Filiacao,
  Modalidade,
  MetodoPagamento,
  Pagamento,
  CompeticaoEvento,
  CompeticaoModalidade,
  CompeticaoEventoModalidade,
  CompeticaoInscricao,
  CompeticaoAutorizacao,
  CompeticaoInvoice,
  CompeticaoInvoiceItem,
} = db;

const {
  calcAgeYears,
  grupoEtarioFromAge,
  divisaoIdadeFromGrupo,
  modalidadePermitidaPorGrupo,
  validatePesoMinimo,
  divisaoPesoPlaceholder,
  requiresAutorizacaoEspecial,
  authorityByEscopo,
  hasMinAntecedenciaDias,
  validateCategoriaCombate,
} = require('../services/competicaoRules');

const coraClient = require('../services/coraClient');
const pagbankClient = require('../services/pagbankClient');

function safeProviderFromMetodo(metodo) {
  const cfg = metodo?.configuracao;
  const provider = (cfg && typeof cfg === 'object') ? cfg.provider : null;
  return (typeof provider === 'string' ? provider.toLowerCase() : null);
}

function parseAddressNumber(logradouro) {
  if (!logradouro || typeof logradouro !== 'string') return null;
  const m = logradouro.match(/(\d{1,6})\s*$/);
  return m ? m[1] : null;
}

async function getAtletaWithUsuario(atletaId) {
  return Atleta.findByPk(atletaId, {
    include: [{ model: Usuario, as: 'usuario', attributes: ['email'] }]
  });
}

async function getEventoOr404(eventoId, res) {
  const evento = await CompeticaoEvento.findByPk(eventoId, {
    include: [
      { model: Modalidade, as: 'modalidadeMae', attributes: ['id', 'nome'] },
      {
        model: CompeticaoModalidade,
        as: 'modalidades',
        through: { attributes: ['taxa_inscricao'] }
      }
    ]
  });
  if (!evento) {
    res.status(404).json({ msg: 'Evento não encontrado.' });
    return null;
  }
  return evento;
}

async function findFiliacaoAtiva(atletaId, modalidadeId) {
  const hoje = new Date();
  const yyyyMMdd = hoje.toISOString().slice(0, 10);

  return Filiacao.findOne({
    where: {
      atleta_id: atletaId,
      modalidade_id: modalidadeId,
      status: 'ativo',
      [Op.or]: [
        { data_vencimento: null },
        { data_vencimento: { [Op.gte]: yyyyMMdd } }
      ]
    },
    include: [{ model: Graduacao, as: 'graduacao', attributes: ['id', 'nome'] }],
    order: [['data_vencimento', 'DESC']]
  });
}

function inferProviderFromMetodo(metodoPagamento) {
  const p = safeProviderFromMetodo(metodoPagamento);
  if (p) return p;
  const nome = (metodoPagamento?.nome || '').toLowerCase();
  if (nome.includes('cora')) return 'cora';
  if (nome.includes('pagbank') || nome.includes('pagseguro')) return 'pagbank';
  if (nome === 'pix') return 'pagbank';
  return null;
}

// =========================
// Eventos (Admin + Público)
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
        { model: Modalidade, as: 'modalidadeMae', attributes: ['id', 'nome'] },
        {
          model: CompeticaoModalidade,
          as: 'modalidades',
          through: { attributes: ['taxa_inscricao'] }
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
    const { nome, descricao, local, escopo, data_evento, data_fim, status, taxa_inscricao, modalidade_id } = req.body;
    if (!nome || !data_evento) return res.status(400).json({ msg: 'Campos obrigatórios: nome, data_evento.' });

    const evento = await CompeticaoEvento.create({
      nome,
      descricao: descricao ?? null,
      local: local ?? null,
      escopo: escopo ?? 'MUNICIPAL',
      data_evento,
      data_fim: data_fim ?? null,
      status: status ?? 'RASCUNHO',
      taxa_inscricao: taxa_inscricao ?? 0,
      modalidade_id: modalidade_id ?? null,
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

    const allowed = ['nome', 'descricao', 'local', 'escopo', 'data_evento', 'data_fim', 'status', 'taxa_inscricao', 'modalidade_id'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    await evento.update(patch);
    res.json(evento);
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// Vincula submodalidades ao evento com taxa por submodalidade
// body: { submodalidades: [{id, taxa_inscricao}] }
exports.atualizarModalidadesDoEvento = async (req, res) => {
  const { eventoId } = req.params;
  try {
    const evento = await CompeticaoEvento.findByPk(eventoId);
    if (!evento) return res.status(404).json({ msg: 'Evento não encontrado.' });

    const { submodalidades } = req.body || {};
    if (!Array.isArray(submodalidades)) {
      return res.status(400).json({ msg: 'Informe submodalidades como array [{id, taxa_inscricao}].' });
    }

    // valida ids
    const ids = submodalidades.map(s => s?.id).filter(Boolean);
    const mods = await CompeticaoModalidade.findAll({ where: { id: { [Op.in]: ids } } });

    const tx = await db.sequelize.transaction();
    try {
      // zera vínculos
      await CompeticaoEventoModalidade.destroy({ where: { evento_id: eventoId }, transaction: tx });

      // recria vínculos com taxa
      for (const s of submodalidades) {
        const m = mods.find(mm => String(mm.id) === String(s.id));
        if (!m) continue;
        await CompeticaoEventoModalidade.create({
          evento_id: Number(eventoId),
          competicao_modalidade_id: m.id,
          taxa_inscricao: Number(s.taxa_inscricao || 0)
        }, { transaction: tx });
      }

      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    const refreshed = await getEventoOr404(eventoId, res);
    if (!refreshed) return;
    res.json(refreshed);
  } catch (err) {
    console.error('Erro ao atualizar modalidades do evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Submodalidades (Admin)
// =========================

exports.listarSubmodalidades = async (req, res) => {
  try {
    const { modalidade_id } = req.query;
    const where = {};
    if (modalidade_id) where.modalidade_id = modalidade_id;

    const itens = await CompeticaoModalidade.findAll({
      where,
      order: [['nome', 'ASC']],
      include: [{ model: Modalidade, as: 'modalidadeMae', attributes: ['id', 'nome'] }]
    });

    res.json(itens);
  } catch (err) {
    console.error('Erro ao listar submodalidades:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.criarSubmodalidade = async (req, res) => {
  try {
    const { code, nome, tipo, modalidade_id, ativo } = req.body || {};
    if (!code || !nome || !tipo || !modalidade_id) {
      return res.status(400).json({ msg: 'Campos obrigatórios: code, nome, tipo, modalidade_id.' });
    }

    const item = await CompeticaoModalidade.create({
      code,
      nome,
      tipo,
      modalidade_id,
      ativo: ativo ?? true
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Erro ao criar submodalidade:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarSubmodalidade = async (req, res) => {
  try {
    const item = await CompeticaoModalidade.findByPk(req.params.submodalidadeId);
    if (!item) return res.status(404).json({ msg: 'Submodalidade não encontrada.' });

    const allowed = ['code', 'nome', 'tipo', 'modalidade_id', 'ativo'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    await item.update(patch);
    res.json(item);
  } catch (err) {
    console.error('Erro ao atualizar submodalidade:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.excluirSubmodalidade = async (req, res) => {
  try {
    const item = await CompeticaoModalidade.findByPk(req.params.submodalidadeId);
    if (!item) return res.status(404).json({ msg: 'Submodalidade não encontrada.' });

    await item.update({ ativo: false });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir submodalidade:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Elegibilidade e Inscrições (Atleta)
// =========================

exports.elegibilidadeEvento = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const evento = await getEventoOr404(req.params.eventoId, res);
    if (!evento) return;

    const atletaId = req.usuario.id;
    const atleta = await getAtletaWithUsuario(atletaId);
    if (!atleta) return res.status(400).json({ msg: 'Crie seu perfil de atleta antes de verificar elegibilidade.' });

    const idadeAnos = calcAgeYears(atleta.data_nascimento, evento.data_evento);
    const grupoEtario = grupoEtarioFromAge(idadeAnos);

    if (!atleta.sexo) {
      return res.status(400).json({ msg: 'Atualize seu perfil: informe o sexo (M/F) para competir.' });
    }
    if (!grupoEtario) {
      return res.status(400).json({ msg: 'Idade mínima para competir na categoria Kadete é 5 anos completos.' });
    }

    const modalidadeMaeId = evento.modalidade_id;
    if (!modalidadeMaeId) {
      return res.status(400).json({ msg: 'Evento sem modalidade mãe configurada (admin).' });
    }

    const filiacao = await findFiliacaoAtiva(atletaId, modalidadeMaeId);

    const result = (evento.modalidades || []).map(m => {
      if (!modalidadePermitidaPorGrupo(grupoEtario, m.code)) {
        return {
          competicao_modalidade_id: m.id,
          nome: m.nome,
          tipo: m.tipo,
          elegivel: false,
          motivo: `Submodalidade não permitida para sua categoria (${grupoEtario}) conforme regulamento.`
        };
      }

      if (!filiacao) {
        return {
          competicao_modalidade_id: m.id,
          nome: m.nome,
          tipo: m.tipo,
          elegivel: false,
          motivo: 'Você não possui filiação ATIVA na modalidade mãe exigida para este evento.'
        };
      }

      return {
        competicao_modalidade_id: m.id,
        nome: m.nome,
        tipo: m.tipo,
        elegivel: true,
        filiacao_id: filiacao.id,
        taxa_inscricao: Number(m.CompeticaoEventoModalidade?.taxa_inscricao || 0)
      };
    });

    res.json({ eventoId: evento.id, status: evento.status, idadeAnos, grupoEtario, modalidades: result });
  } catch (err) {
    console.error('Erro ao calcular elegibilidade:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// Cria N inscrições + 1 invoice com itens
// body: { competicao_modalidade_ids: number[], peso_kg?, categoria_combate? }
exports.criarInscricao = async (req, res) => {
  const { eventoId } = req.params;

  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const { competicao_modalidade_ids, peso_kg, categoria_combate } = req.body || {};
    if (!Array.isArray(competicao_modalidade_ids) || competicao_modalidade_ids.length === 0) {
      return res.status(400).json({ msg: 'Informe competicao_modalidade_ids como array (1 ou mais submodalidades).' });
    }

    const evento = await getEventoOr404(eventoId, res);
    if (!evento) return;
    if (evento.status !== 'INSCRICOES_ABERTAS') {
      return res.status(400).json({ msg: `Inscrições não estão abertas (status atual: ${evento.status}).` });
    }

    const atletaId = req.usuario.id;
    const atleta = await getAtletaWithUsuario(atletaId);
    if (!atleta) return res.status(400).json({ msg: 'Crie seu perfil de atleta antes de se inscrever.' });

    const idadeAnos = calcAgeYears(atleta.data_nascimento, evento.data_evento);
    const grupoEtario = grupoEtarioFromAge(idadeAnos);

    if (!atleta.sexo) {
      return res.status(400).json({ msg: 'Atualize seu perfil: informe o sexo (M/F) para competir.' });
    }
    if (!grupoEtario) {
      return res.status(400).json({ msg: 'Idade mínima para competir na categoria Kadete é 5 anos completos.' });
    }

    const modalidadeMaeId = evento.modalidade_id;
    if (!modalidadeMaeId) {
      return res.status(400).json({ msg: 'Evento sem modalidade mãe configurada (admin).' });
    }

    const filiacao = await findFiliacaoAtiva(atletaId, modalidadeMaeId);
    if (!filiacao) {
      return res.status(403).json({ msg: 'Você não possui filiação ativa na modalidade mãe exigida para este evento.' });
    }

    // Validações adicionais (quando informadas)
    if (peso_kg != null) {
      const pesoCheck = validatePesoMinimo(grupoEtario, peso_kg);
      if (!pesoCheck.ok) return res.status(400).json({ msg: pesoCheck.msg });
    }

    if (categoria_combate != null) {
      const catCheck = validateCategoriaCombate(categoria_combate, filiacao?.graduacao?.nome);
      if (!catCheck.ok) return res.status(400).json({ msg: catCheck.msg });
    }

    // Autorização especial (apenas atletas acima de 40 anos)
    const precisaAutorizacao = requiresAutorizacaoEspecial(idadeAnos);
    if (precisaAutorizacao) {
      if (!hasMinAntecedenciaDias(evento.data_evento, new Date(), 30)) {
        return res.status(400).json({ msg: 'Para atletas acima de 40 anos, a Autorização Especial deve ser solicitada com antecedência mínima de 30 dias.' });
      }
      const authority = authorityByEscopo(evento.escopo);
      await CompeticaoAutorizacao.findOrCreate({
        where: { evento_id: evento.id, atleta_id: atletaId, authority },
        defaults: { status: 'PENDENTE', requested_at: new Date() }
      });
    }

    // Mapa das submodalidades habilitadas no evento
    const habilitadas = new Map();
    for (const m of (evento.modalidades || [])) {
      habilitadas.set(String(m.id), m);
    }

    const idsUnicos = [...new Set(competicao_modalidade_ids.map(String))];
    const escolhidas = [];

    for (const idStr of idsUnicos) {
      const m = habilitadas.get(idStr);
      if (!m) return res.status(400).json({ msg: `Submodalidade ${idStr} não está habilitada para o evento.` });

      // regulamento por grupo
      if (!modalidadePermitidaPorGrupo(grupoEtario, m.code)) {
        return res.status(400).json({ msg: `Submodalidade ${m.nome} não é permitida para sua categoria (${grupoEtario}).` });
      }

      // valida se pertence à modalidade mãe do evento
      if (String(m.modalidade_id) !== String(modalidadeMaeId)) {
        return res.status(400).json({ msg: `Submodalidade ${m.nome} não pertence à modalidade mãe deste evento.` });
      }

      escolhidas.push(m);
    }

    const tx = await db.sequelize.transaction();

    try {
      const inscricoesCriadas = [];
      const itens = [];
      let total = 0;

      for (const m of escolhidas) {
        // evita duplicidade
        const existente = await CompeticaoInscricao.findOne({
          where: { evento_id: evento.id, atleta_id: atletaId, competicao_modalidade_id: m.id },
          transaction: tx,
          lock: tx.LOCK.UPDATE
        });
        if (existente) {
          throw new Error(`Você já possui inscrição na submodalidade ${m.nome} para este evento.`);
        }

        const divisaoIdade = divisaoIdadeFromGrupo(grupoEtario);
        const divisaoPeso = (peso_kg != null) ? divisaoPesoPlaceholder(peso_kg) : null;

        const taxa = Number(m.CompeticaoEventoModalidade?.taxa_inscricao || 0);
        total += taxa;

        const statusBase = (total <= 0)
          ? (precisaAutorizacao ? 'AGUARDANDO_AUTORIZACAO' : 'CONFIRMADA')
          : 'PENDENTE_PAGAMENTO';

        const insc = await CompeticaoInscricao.create({
          evento_id: evento.id,
          atleta_id: atletaId,
          filiacao_id: filiacao.id,
          competicao_modalidade_id: m.id,
          peso_kg: (peso_kg != null ? peso_kg : null),
          idade_anos: idadeAnos,
          grupo_etario: grupoEtario,
          divisao_idade: divisaoIdade,
          divisao_peso: divisaoPeso,
          categoria_combate: (categoria_combate != null ? categoria_combate : null),
          status: statusBase,
        }, { transaction: tx });

        inscricoesCriadas.push(insc);

        itens.push({
          competicao_inscricao_id: insc.id,
          descricao: `${m.nome}`,
          valor: taxa
        });
      }

      // cria invoice (uma por ato de inscrição)
      const invoice = await CompeticaoInvoice.create({
        atleta_id: atletaId,
        evento_id: evento.id,
        status: (total > 0 ? 'PENDENTE' : 'PAGO'),
        valor_total: total,
      }, { transaction: tx });

      for (const it of itens) {
        await CompeticaoInvoiceItem.create({
          invoice_id: invoice.id,
          competicao_inscricao_id: it.competicao_inscricao_id,
          descricao: it.descricao,
          valor: it.valor
        }, { transaction: tx });
      }

      await tx.commit();

      const invoiceFull = await CompeticaoInvoice.findByPk(invoice.id, {
        include: [
          { model: CompeticaoEvento, as: 'evento' },
          { model: CompeticaoInvoiceItem, as: 'itens', include: [{ model: CompeticaoInscricao, as: 'inscricao', include: [{ model: CompeticaoModalidade, as: 'competicaoModalidade' }] }] },
          { model: Pagamento, as: 'pagamentos', include: [{ model: MetodoPagamento, as: 'metodoPagamento', attributes: ['id', 'nome', 'configuracao'] }] }
        ]
      });

      return res.status(201).json({
        invoice: invoiceFull,
        total: Number(total.toFixed(2)),
        inscricoes: invoiceFull.itens?.map(i => i.inscricao) || []
      });

    } catch (e) {
      await tx.rollback();
      const msg = e?.message || 'Erro ao criar inscrição.';
      if (msg.startsWith('Você já possui inscrição')) return res.status(400).json({ msg });
      console.error('Erro ao criar inscrição:', e);
      return res.status(500).send('Erro no servidor.');
    }

  } catch (err) {
    console.error('Erro ao criar inscrição:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.minhasInscricoes = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const inscricoes = await CompeticaoInscricao.findAll({
      where: { atleta_id: req.usuario.id },
      order: [['created_at', 'DESC']],
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
        { model: CompeticaoInvoiceItem, as: 'invoiceItem', include: [{ model: CompeticaoInvoice, as: 'invoice' }] },
      ]
    });

    res.json(inscricoes);
  } catch (err) {
    console.error('Erro ao listar minhas inscrições:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.detalheInscricao = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });

    const where = { id: req.params.inscricaoId };
    if (req.usuario.tipo === 'atleta') where.atleta_id = req.usuario.id;

    const insc = await CompeticaoInscricao.findOne({
      where,
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
        { model: CompeticaoInvoiceItem, as: 'invoiceItem', include: [{ model: CompeticaoInvoice, as: 'invoice' }] },
      ]
    });

    if (!insc) return res.status(404).json({ msg: 'Inscrição não encontrada.' });
    res.json(insc);
  } catch (err) {
    console.error('Erro ao obter detalhe da inscrição:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.cancelarInscricao = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const insc = await CompeticaoInscricao.findOne({
      where: { id: req.params.inscricaoId, atleta_id: req.usuario.id }
    });

    if (!insc) return res.status(404).json({ msg: 'Inscrição não encontrada.' });
    if (insc.status !== 'PENDENTE_PAGAMENTO') {
      return res.status(400).json({ msg: 'Só é possível cancelar inscrições pendentes de pagamento.' });
    }

    await insc.update({ status: 'CANCELADA' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao cancelar inscrição:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Invoice (Atleta)
// =========================

exports.minhasInvoices = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const invoices = await CompeticaoInvoice.findAll({
      where: { atleta_id: req.usuario.id },
      order: [['created_at', 'DESC']],
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoInvoiceItem, as: 'itens' },
        { model: Pagamento, as: 'pagamentos', include: [{ model: MetodoPagamento, as: 'metodoPagamento', attributes: ['id', 'nome', 'configuracao'] }] }
      ]
    });

    res.json(invoices);
  } catch (err) {
    console.error('Erro ao listar minhas invoices:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.getInvoice = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });

    const where = { id: req.params.invoiceId };
    if (req.usuario.tipo === 'atleta') where.atleta_id = req.usuario.id;

    const invoice = await CompeticaoInvoice.findOne({
      where,
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoInvoiceItem, as: 'itens', include: [{ model: CompeticaoInscricao, as: 'inscricao', include: [{ model: CompeticaoModalidade, as: 'competicaoModalidade' }] }] },
        { model: Pagamento, as: 'pagamentos', include: [{ model: MetodoPagamento, as: 'metodoPagamento', attributes: ['id', 'nome', 'configuracao'] }] }
      ]
    });

    if (!invoice) return res.status(404).json({ msg: 'Invoice não encontrada.' });
    res.json(invoice);
  } catch (err) {
    console.error('Erro ao obter invoice:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.cancelarInvoice = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const invoice = await CompeticaoInvoice.findOne({
      where: { id: req.params.invoiceId, atleta_id: req.usuario.id }
    });

    if (!invoice) return res.status(404).json({ msg: 'Invoice não encontrada.' });
    if (invoice.status !== 'PENDENTE') return res.status(400).json({ msg: 'Somente invoices pendentes podem ser canceladas.' });

    await invoice.update({ status: 'CANCELADO' });
    // opcional: cancelar inscrições pendentes associadas
    await CompeticaoInvoiceItem.update({ updated_at: new Date() }, { where: { invoice_id: invoice.id } });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao cancelar invoice:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Cobrança (Invoice)
// =========================

exports.criarCobrancaInvoice = async (req, res) => {
  const { invoiceId } = req.params;
  const { metodoPagamentoId, forceNew } = req.body || {};

  if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
  if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

  try {
    const invoice = await CompeticaoInvoice.findOne({
      where: {
        id: invoiceId,
        atleta_id: req.usuario.id,
        status: 'PENDENTE'
      },
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoInvoiceItem, as: 'itens' },
      ]
    });

    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice não encontrada ou não está pendente de pagamento.' });
    }

    const total = Number(invoice.valor_total || 0);
    if (total <= 0) {
      return res.status(400).json({ msg: 'Esta invoice não possui valor a pagar.' });
    }

    const atleta = await getAtletaWithUsuario(req.usuario.id);
    if (!atleta || !atleta.usuario) {
      return res.status(400).json({ msg: 'Dados do atleta incompletos.' });
    }

    const metodosAtivos = await MetodoPagamento.findAll({ where: { ativo: true } });
    if (!metodosAtivos || metodosAtivos.length === 0) {
      return res.status(400).json({ msg: 'Nenhum método de pagamento ativo configurado. Contate o administrador.' });
    }

    let metodoPagamento = null;
    if (metodoPagamentoId) {
      metodoPagamento = metodosAtivos.find(m => String(m.id) === String(metodoPagamentoId));
      if (!metodoPagamento) return res.status(400).json({ msg: 'Método de pagamento inválido ou inativo.' });
    } else {
      const byProvider = (prov) => metodosAtivos.find(m => {
        const p = safeProviderFromMetodo(m) || (typeof m.nome === 'string' ? m.nome.toLowerCase() : '');
        return p.includes(prov);
      });
      metodoPagamento = byProvider('cora') || byProvider('pagbank') || metodosAtivos[0];
    }

    // Reuso de cobrança pendente
    if (!forceNew) {
      const pendente = await Pagamento.findOne({
        where: { competicao_invoice_id: invoiceId, status: 'pendente' },
        order: [['createdAt', 'DESC']],
        include: [{ model: MetodoPagamento, as: 'metodoPagamento', attributes: ['id', 'nome', 'configuracao'] }]
      });
      if (pendente && (pendente.qr_code_pix || pendente.linha_digitavel_boleto || pendente.id_transacao_gateway)) {
        const provider = safeProviderFromMetodo(pendente.metodoPagamento) || null;
        return res.status(200).json({
          pagamentoId: pendente.id,
          metodoPagamento: { id: pendente.metodoPagamento?.id, nome: pendente.metodoPagamento?.nome, provider },
          pix: { qrCodeText: pendente.qr_code_pix || null },
          boleto: { linhaDigitavel: pendente.linha_digitavel_boleto || null },
          valor: pendente.valor_pago,
          status: pendente.status,
          reused: true
        });
      }
    }

    const valorCentavos = Math.round(total * 100);
    const cpfDigits = String(atleta.cpf || '').replace(/\D/g, '');
    const cepDigits = String(atleta.cep || '').replace(/\D/g, '');

    // Cria pagamento local
    let pagamento = await Pagamento.create({
      competicao_invoice_id: invoiceId,
      metodo_pagamento_id: metodoPagamento.id,
      valor_pago: total,
      status: 'pendente',
    });

    let provider = inferProviderFromMetodo(metodoPagamento) || 'pagbank';
    let fallbackUsed = false;

    const finalizar = async (metodoFinal, providerFinal, gatewayData) => {
      await pagamento.update({
        metodo_pagamento_id: metodoFinal.id,
        valor_pago: total,
        id_transacao_gateway: gatewayData.idTransacaoGateway,
        qr_code_pix: gatewayData.qrCodeText || null,
        linha_digitavel_boleto: gatewayData.linhaDigitavel || null,
      });

      return res.status(201).json({
        pagamentoId: pagamento.id,
        metodoPagamento: { id: metodoFinal.id, nome: metodoFinal.nome, provider: providerFinal },
        pix: { qrCodeText: gatewayData.qrCodeText || null },
        boleto: { linhaDigitavel: gatewayData.linhaDigitavel || null },
        valor: pagamento.valor_pago,
        status: pagamento.status,
        fallbackUsed
      });
    };

    const descricao = `Inscrição Competição: ${invoice.evento?.nome || 'Evento'} (${invoice.itens?.length || 0} modalidade(s))`;

    try {
      if (provider === 'cora') {
        const missing = [];
        if (!atleta.logradouro) missing.push('logradouro');
        if (!atleta.bairro) missing.push('bairro');
        if (!atleta.cidade) missing.push('cidade');
        if (!atleta.estado) missing.push('estado');
        if (!cepDigits) missing.push('cep');
        if (missing.length) {
          await pagamento.destroy();
          return res.status(400).json({ msg: `Para pagar via Cora, atualize seu endereço do perfil. Campos faltando: ${missing.join(', ')}.` });
        }

        const addrNumber = parseAddressNumber(atleta.logradouro) || '0';

        const resp = await coraClient.criarCobrancaPix({
          valorCentavos,
          nome: atleta.nome || 'Atleta',
          cpf: cpfDigits,
          email: atleta.usuario.email,
          descricao,
          endereco: {
            logradouro: atleta.logradouro,
            numero: addrNumber,
            bairro: atleta.bairro,
            cidade: atleta.cidade,
            estado: atleta.estado,
            cep: cepDigits,
          },
        }, metodoPagamento.configuracao || {});

        await invoice.update({ gateway: 'cora', id_transacao_gateway: resp.idTransacaoGateway || null });
        return finalizar(metodoPagamento, 'cora', resp);
      }

      // default pagbank
      const resp = await pagbankClient.criarCobrancaPix({
        valorCentavos,
        nome: atleta.nome || 'Atleta',
        cpf: cpfDigits,
        email: atleta.usuario.email,
        descricao,
      }, metodoPagamento.configuracao || {});

      await invoice.update({ gateway: 'pagbank', id_transacao_gateway: resp.idTransacaoGateway || null });
      return finalizar(metodoPagamento, 'pagbank', resp);

    } catch (errProvider) {
      console.error('Erro ao criar cobrança no provider:', errProvider);

      // fallback automático Cora -> PagBank
      if (provider === 'cora') {
        const byProvider = (prov) => metodosAtivos.find(m => {
          const p = safeProviderFromMetodo(m) || (typeof m.nome === 'string' ? m.nome.toLowerCase() : '');
          return p.includes(prov);
        });

        const fallbackMetodo = byProvider('pagbank') || metodosAtivos.find(m => (m.nome || '').toLowerCase().includes('pix')) || null;
        if (fallbackMetodo) {
          fallbackUsed = true;
          const resp = await pagbankClient.criarCobrancaPix({
            valorCentavos,
            nome: atleta.nome || 'Atleta',
            cpf: cpfDigits,
            email: atleta.usuario.email,
            descricao,
          }, fallbackMetodo.configuracao || {});

          await invoice.update({ gateway: 'pagbank', id_transacao_gateway: resp.idTransacaoGateway || null });
          return finalizar(fallbackMetodo, 'pagbank', resp);
        }
      }

      await pagamento.destroy();
      return res.status(500).json({ msg: 'Falha ao gerar cobrança. Tente novamente ou contate o suporte.' });
    }

  } catch (err) {
    console.error('Erro ao criar cobrança da invoice:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Admin: inscrições / invoices
// =========================

exports.listarInscricoesEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const where = { evento_id: eventoId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.competicao_modalidade_id) where.competicao_modalidade_id = req.query.competicao_modalidade_id;

    const data = await CompeticaoInscricao.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: Atleta, as: 'atleta' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
        { model: CompeticaoInvoiceItem, as: 'invoiceItem', include: [{ model: CompeticaoInvoice, as: 'invoice' }] },
      ]
    });

    res.json(data);
  } catch (err) {
    console.error('Erro ao listar inscrições do evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarInscricaoAdmin = async (req, res) => {
  try {
    const insc = await CompeticaoInscricao.findByPk(req.params.inscricaoId);
    if (!insc) return res.status(404).json({ msg: 'Inscrição não encontrada.' });

    const allowed = ['status', 'motivo_bloqueio'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    await insc.update(patch);
    res.json(insc);
  } catch (err) {
    console.error('Erro ao atualizar inscrição (admin):', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.listarInvoicesEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const where = { evento_id: eventoId };
    if (req.query.status) where.status = req.query.status;

    const invoices = await CompeticaoInvoice.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: Atleta, as: 'atleta' },
        { model: CompeticaoInvoiceItem, as: 'itens' },
        { model: Pagamento, as: 'pagamentos', include: [{ model: MetodoPagamento, as: 'metodoPagamento', attributes: ['id', 'nome', 'configuracao'] }] },
      ]
    });

    res.json(invoices);
  } catch (err) {
    console.error('Erro ao listar invoices do evento:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarInvoiceAdmin = async (req, res) => {
  try {
    const invoice = await CompeticaoInvoice.findByPk(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ msg: 'Invoice não encontrada.' });

    const allowed = ['status'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    await invoice.update(patch);
    res.json(invoice);
  } catch (err) {
    console.error('Erro ao atualizar invoice (admin):', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Autorizações (Admin) - mantém endpoints existentes
// =========================

exports.listarAutorizacoesEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const data = await CompeticaoAutorizacao.findAll({
      where: { evento_id: eventoId },
      order: [['requested_at', 'DESC']],
      include: [{ model: Atleta, as: 'atleta' }]
    });
    res.json(data);
  } catch (err) {
    console.error('Erro ao listar autorizações:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.revisarAutorizacao = async (req, res) => {
  try {
    const { autorizacaoId } = req.params;
    const { aprovado, notes } = req.body || {};

    const auth = await CompeticaoAutorizacao.findByPk(autorizacaoId);
    if (!auth) return res.status(404).json({ msg: 'Autorização não encontrada.' });

    const status = aprovado ? 'APROVADO' : 'REPROVADO';
    await auth.update({ status, reviewed_at: new Date(), notes: notes ?? null });

    res.json(auth);
  } catch (err) {
    console.error('Erro ao revisar autorização:', err);
    res.status(500).send('Erro no servidor.');
  }
};
