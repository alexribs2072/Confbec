const db = require('../models');
const crypto = require('crypto'); // Necessário para idempotency key

// IMPORTANTE: Ajuste o caminho se necessário para importar seus clients reais
// const { coraClient, pagbankClient } = require('../services/paymentClients'); 
// Assumindo que eles podem estar globais ou você deve descomentar acima.

const {
  Atleta,
  Usuario,
  Filiacao,
  Graduacao,
  Modalidade,
  MetodoPagamento,
  PagamentoItem,
  Pagamento,
  CompeticaoEvento,
  CompeticaoModalidade,
  CompeticaoInscricao,
  CompeticaoAutorizacao,
  CompeticaoEventoModalidade,
} = db;

const { Op } = db.Sequelize;

// Importação das regras
const {
  calcAgeYears,
  grupoEtarioFromAge,
  divisaoIdadeFromGrupo,
  modalidadePermitidaPorGrupo,
  pesoDivisoesByGrupo, 
  validatePesoMinimo,
  divisaoPesoFromGrupo,
  divisaoPesoLabel,
  fightConfigByModalidadeCode,
  requiresAutorizacaoEspecial,
  authorityByEscopo,
  hasMinAntecedenciaDias,
  validateCategoriaCombate,
} = require('../services/competicaoRules');

// =========================
// Helpers Internos
// =========================

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

// Repetido aqui para independência
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

// =========================
// Elegibilidade e Inscrições (Atleta)
// =========================

exports.elegibilidadeEvento = async (req, res) => {
  console.log(`>>> [Elegibilidade] Iniciando verificação para Evento ID: ${req.params.eventoId}`);
  
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const evento = await getEventoOr404(req.params.eventoId, res);
    if (!evento) return; 

    const atletaId = req.usuario.id;
    const atleta = await getAtletaWithUsuario(atletaId);
    
    if (!atleta) {
      console.warn(`>>> [Elegibilidade] Atleta não encontrado para Usuario ID: ${atletaId}`);
      return res.status(400).json({ msg: 'Crie seu perfil de atleta antes de verificar elegibilidade.' });
    }

    if (!atleta.data_nascimento) return res.status(400).json({ msg: 'Data de nascimento não cadastrada no perfil.' });
    
    if (atleta.sexo === undefined) {
        console.error(">>> [ERRO CRÍTICO] O campo 'sexo' veio undefined do banco.");
        return res.status(500).json({ msg: 'Erro interno: Campo de sexo não encontrado no sistema.' });
    }
    if (!atleta.sexo) return res.status(400).json({ msg: 'Atualize seu perfil: informe o sexo (M/F) para competir.' });

    let idadeAnos, grupoEtario;
    try {
        idadeAnos = calcAgeYears(atleta.data_nascimento, evento.data_evento);
        grupoEtario = grupoEtarioFromAge(idadeAnos);
        console.log(`>>> [Elegibilidade] Atleta: ${atleta.nome_completo}, Idade: ${idadeAnos}, Grupo: ${grupoEtario}, Sexo: ${atleta.sexo}`);
    } catch (calcErr) {
        console.error(">>> [Elegibilidade] Erro ao calcular idade/grupo:", calcErr);
        return res.status(400).json({ msg: 'Erro ao calcular sua categoria de idade.' });
    }

    if (!grupoEtario) return res.status(400).json({ msg: 'Idade mínima para competir na categoria Kadete é 5 anos completos.' });

    let pesoTabela = null;
    try {
        if (typeof pesoDivisoesByGrupo === 'function') {
            pesoTabela = pesoDivisoesByGrupo(grupoEtario);
        } else {
            console.warn(">>> [AVISO IMPORTANTE] pesoDivisoesByGrupo não é uma função válida.");
        }
    } catch (errPeso) {
        console.error(">>> [ERRO] Falha ao executar pesoDivisoesByGrupo:", errPeso);
    }

    const result = [];
    const modalidadesEvento = evento.modalidades || [];

    for (const m of modalidadesEvento) {
      try {
          const requiredModalidadeId = m.filiacao_modalidade_id;
          
          const taxaEvento = Number(evento.taxa_inscricao || 0);
          const taxaVinculo = m.CompeticaoEventoModalidade ? Number(m.CompeticaoEventoModalidade.taxa_inscricao) : null;
          const taxaModalidade = taxaVinculo !== null && !isNaN(taxaVinculo) ? taxaVinculo : taxaEvento;

          const modalidadeCode = m.code || 'UNKNOWN';
          let fightConfig = null;
          try {
             fightConfig = fightConfigByModalidadeCode(modalidadeCode, idadeAnos);
          } catch (fcErr) {
             console.warn(`>>> Erro ao gerar fightConfig para ${modalidadeCode}:`, fcErr.message);
          }

          if (!modalidadePermitidaPorGrupo(grupoEtario, modalidadeCode)) {
            result.push({
              competicao_modalidade_id: m.id,
              code: modalidadeCode,
              nome: m.nome,
              tipo: m.tipo,
              taxa_inscricao: taxaModalidade,
              elegivel: false,
              motivo: `Modalidade não permitida para sua categoria (${grupoEtario}) conforme regulamento.`,
              fight_config: fightConfig,
            });
            continue;
          }

          if (!requiredModalidadeId) {
            result.push({
              competicao_modalidade_id: m.id,
              code: modalidadeCode,
              nome: m.nome,
              tipo: m.tipo,
              taxa_inscricao: taxaModalidade,
              elegivel: false,
              motivo: 'Modalidade ainda não vinculada a uma modalidade de filiação (configuração admin).',
              fight_config: fightConfig,
            });
            continue;
          }

          const filiacao = await findFiliacaoAtiva(atletaId, requiredModalidadeId);
          if (!filiacao) {
            result.push({
              competicao_modalidade_id: m.id,
              code: modalidadeCode,
              nome: m.nome,
              tipo: m.tipo,
              taxa_inscricao: taxaModalidade,
              elegivel: false,
              motivo: 'Você não possui filiação ATIVA na modalidade exigida.',
              fight_config: fightConfig,
            });
            continue;
          }

          result.push({
            competicao_modalidade_id: m.id,
            code: modalidadeCode,
            nome: m.nome,
            tipo: m.tipo,
            taxa_inscricao: taxaModalidade,
            elegivel: true,
            filiacao_id: filiacao.id,
            fight_config: fightConfig,
          });

      } catch (loopErr) {
          console.error(`>>> [Elegibilidade] Erro ao processar modalidade ID ${m.id}:`, loopErr);
          result.push({
              competicao_modalidade_id: m.id,
              nome: m.nome,
              elegivel: false,
              motivo: 'Erro interno ao processar regras desta modalidade.'
          });
      }
    }

    res.json({
      eventoId: evento.id,
      status: evento.status,
      idadeAnos,
      grupoEtario,
      peso_divisoes: pesoTabela?.cortes || null,
      peso_acima_de: pesoTabela?.acimaDe || null,
      modalidades: result,
    });

  } catch (err) {
    console.error('>>> [Elegibilidade] ERRO FATAL:', err);
    if (err.name === 'SequelizeDatabaseError' && err.message.includes('no such column')) {
        return res.status(500).json({ msg: 'Erro de Banco de Dados: Coluna ausente. Contate o suporte.' });
    }
    res.status(500).send('Erro no servidor ao calcular elegibilidade.');
  }
};

exports.criarInscricao = async (req, res) => {
  try {
    const body = req.body || {};
    const ids = Array.isArray(body.competicao_modalidade_ids) ? body.competicao_modalidade_ids
      : (body.competicao_modalidade_id ? [body.competicao_modalidade_id] : null);

    if (!ids || ids.length === 0) {
      return res.status(400).json({ msg: 'Informe competicao_modalidade_id ou competicao_modalidade_ids (array).' });
    }

    req.body = {
      modalidade_ids: ids,
      peso_kg: body.peso_kg,
      categoria_combate: body.categoria_combate,
    };

    return exports.criarInscricoesLote(req, res);
  } catch (err) {
    console.error('Erro ao criar inscrição:', err);
    return res.status(500).json({ msg: 'Erro ao criar inscrição.' });
  }
};

exports.criarInscricoesLote = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const { modalidade_ids, peso_kg, categoria_combate } = req.body || {};
    if (!Array.isArray(modalidade_ids) || modalidade_ids.length === 0) {
      return res.status(400).json({ msg: 'Informe modalidade_ids como array (mínimo 1).' });
    }
    if (!peso_kg || !categoria_combate) {
      return res.status(400).json({ msg: 'Campos obrigatórios: peso_kg, categoria_combate.' });
    }

    const evento = await getEventoOr404(req.params.eventoId, res);
    if (!evento) return;
    if (evento.status !== 'INSCRICOES_ABERTAS') {
      return res.status(400).json({ msg: `Inscrições não estão abertas (status atual: ${evento.status}).` });
    }

    const atletaId = req.usuario.id;
    const atleta = await getAtletaWithUsuario(atletaId);
    if (!atleta) return res.status(400).json({ msg: 'Crie seu perfil de atleta antes de se inscrever.' });

    const idadeAnos = calcAgeYears(atleta.data_nascimento, evento.data_evento);
    const grupoEtario = grupoEtarioFromAge(idadeAnos);
    if (!atleta.sexo) return res.status(400).json({ msg: 'Atualize seu perfil: informe o sexo (M/F) para competir.' });
    if (!grupoEtario) return res.status(400).json({ msg: 'Idade mínima para competir na categoria Kadete é 5 anos completos.' });

    const pesoCheck = validatePesoMinimo(grupoEtario, peso_kg);
    if (!pesoCheck.ok) return res.status(400).json({ msg: pesoCheck.msg });
    const divisaoIdade = divisaoIdadeFromGrupo(grupoEtario);
    const divisaoPeso = divisaoPesoFromGrupo(grupoEtario, peso_kg);
    if (!divisaoPeso) {
      return res.status(400).json({ msg: 'Não foi possível calcular a divisão de peso (tabela oficial).' });
    }

    const catCheck = validateCategoriaCombate(categoria_combate, null);
    if (!catCheck.ok) return res.status(400).json({ msg: catCheck.msg });

    const wanted = [...new Set(modalidade_ids.map((x) => Number(x)).filter(Boolean))];
    const modsEvento = (evento.modalidades || []);
    const byId = new Map(modsEvento.map(m => [Number(m.id), m]));

    for (const mid of wanted) {
      const mod = byId.get(mid);
      if (!mod) return res.status(400).json({ msg: `A modalidade ${mid} não está habilitada para o evento.` });
      if (!mod.filiacao_modalidade_id) {
        return res.status(400).json({ msg: `Modalidade ${mod.nome} ainda não vinculada a uma modalidade de filiação.` });
      }
      if (!modalidadePermitidaPorGrupo(grupoEtario, mod.code)) {
        return res.status(400).json({ msg: `A modalidade ${mod.nome} não é permitida para sua categoria.` });
      }
    }

    const filiacaoByModId = {};
    for (const mid of wanted) {
      const mod = byId.get(mid);
      const filiacao = await findFiliacaoAtiva(atletaId, mod.filiacao_modalidade_id);
      if (!filiacao) {
        return res.status(403).json({ msg: `Você não possui filiação ativa para: ${mod.nome}.` });
      }
      filiacaoByModId[mid] = filiacao;
    }

    const existentes = await CompeticaoInscricao.findAll({
      where: { evento_id: evento.id, atleta_id: atletaId, competicao_modalidade_id: { [Op.in]: wanted } },
      attributes: ['competicao_modalidade_id']
    });
    if (existentes?.length) {
      const nomes = existentes.map(e => byId.get(Number(e.competicao_modalidade_id))?.nome || e.competicao_modalidade_id);
      return res.status(400).json({ msg: `Você já possui inscrição nas modalidades: ${nomes.join(', ')}.` });
    }

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

    const t = await db.sequelize.transaction();
    try {
      const criadas = [];
      let total = 0;
      for (const mid of wanted) {
        const mod = byId.get(mid);
        const filiacao = filiacaoByModId[mid];
        const taxa = Number(mod?.CompeticaoEventoModalidade?.taxa_inscricao ?? evento.taxa_inscricao ?? 0);
        let status = 'PENDENTE_PAGAMENTO';
        if (taxa <= 0) status = precisaAutorizacao ? 'AGUARDANDO_AUTORIZACAO' : 'CONFIRMADA';

        const inscricao = await CompeticaoInscricao.create({
          evento_id: evento.id,
          atleta_id: atletaId,
          filiacao_id: filiacao.id,
          competicao_modalidade_id: mod.id,
          peso_kg,
          idade_anos: idadeAnos,
          grupo_etario: grupoEtario,
          divisao_idade: divisaoIdade,
          divisao_peso: divisaoPeso,
          categoria_combate,
          status,
        }, { transaction: t });

        const payload = inscricao.toJSON();
        payload.taxa_inscricao = taxa;
        payload.divisao_peso_label = divisaoPesoLabel(divisaoPeso);
        payload.fight_config = fightConfigByModalidadeCode(mod.code, idadeAnos);
        criadas.push(payload);

        total += Number(taxa || 0);
      }

      await t.commit();
      return res.status(201).json({ total, inscricoes: criadas });
    } catch (e) {
      await t.rollback();
      console.error('Erro ao criar inscrições em lote:', e);
      return res.status(500).send('Erro no servidor.');
    }
  } catch (err) {
    console.error('Erro ao criar inscrições em lote:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.carrinho = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const inscricoes = await CompeticaoInscricao.findAll({
      where: { atleta_id: req.usuario.id, status: 'PENDENTE_PAGAMENTO' },
      order: [['created_at', 'DESC']],
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
      ]
    });

    const ids = (inscricoes || []).map(i => i.id);
    if (!ids.length) return res.json({ total: 0, itens: [] });

    const itensPagos = await PagamentoItem.findAll({
      where: { competicao_inscricao_id: { [Op.in]: ids } },
      attributes: ['competicao_inscricao_id']
    });
    const jaNoPagamento = new Set((itensPagos || []).map(x => Number(x.competicao_inscricao_id)));
    const pendentes = (inscricoes || []).filter(i => !jaNoPagamento.has(Number(i.id)));

    const keys = pendentes.map(i => ({ evento_id: i.evento_id, competicao_modalidade_id: i.competicao_modalidade_id }));
    const eventoIds = [...new Set(keys.map(k => Number(k.evento_id)))];
    const modIds = [...new Set(keys.map(k => Number(k.competicao_modalidade_id)))];

    const vinculos = await CompeticaoEventoModalidade.findAll({
      where: {
        evento_id: { [Op.in]: eventoIds },
        competicao_modalidade_id: { [Op.in]: modIds },
      }
    });
    const taxaByKey = new Map((vinculos || []).map(v => [`${v.evento_id}:${v.competicao_modalidade_id}`, Number(v.taxa_inscricao || 0)]));

    let total = 0;
    const itens = pendentes.map(i => {
      const j = i.toJSON();
      const taxa = taxaByKey.get(`${j.evento_id}:${j.competicao_modalidade_id}`) ?? Number(j.evento?.taxa_inscricao ?? 0);
      j.taxa_inscricao = Number(taxa || 0);
      total += Number(j.taxa_inscricao || 0);
      j.divisao_peso_label = divisaoPesoLabel(j.divisao_peso);
      j.fight_config = fightConfigByModalidadeCode(j.competicaoModalidade?.code, j.idade_anos);
      return j;
    });

    return res.json({ total, itens });
  } catch (err) {
    console.error('Erro ao obter carrinho:', err);
    return res.status(500).json({ msg: 'Erro ao obter carrinho.' });
  }
};

exports.checkoutLote = async (req, res) => {
  const body = req.body || {};
  const inscricao_ids = Array.isArray(body.inscricao_ids) ? body.inscricao_ids : [];
  const metodoPagamentoId = body.metodo_pagamento_id || body.metodoPagamentoId;

  if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
  if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });
  if (!inscricao_ids.length) return res.status(400).json({ msg: 'Informe inscricao_ids (array).' });
  if (!metodoPagamentoId) return res.status(400).json({ msg: 'Informe metodo_pagamento_id.' });

  try {
    const inscricoes = await CompeticaoInscricao.findAll({
      where: {
        id: { [Op.in]: inscricao_ids.map(Number) },
        atleta_id: req.usuario.id,
        status: 'PENDENTE_PAGAMENTO'
      },
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
      ]
    });

    if (!inscricoes || inscricoes.length === 0) {
      return res.status(404).json({ msg: 'Nenhuma inscrição pendente encontrada.' });
    }
    if (inscricoes.length !== inscricao_ids.length) {
      return res.status(400).json({ msg: 'Uma ou mais inscrições são inválidas ou não são suas.' });
    }

    const itensExistentes = await PagamentoItem.findAll({
      where: { competicao_inscricao_id: { [Op.in]: inscricao_ids.map(Number) } },
      attributes: ['competicao_inscricao_id']
    });
    if (itensExistentes?.length) {
      const ids = itensExistentes.map(x => Number(x.competicao_inscricao_id));
      return res.status(400).json({ msg: `Uma ou mais inscrições já estão em uma cobrança: ${ids.join(', ')}.` });
    }

    const atleta = await getAtletaWithUsuario(req.usuario.id);
    if (!atleta || !atleta.usuario) {
      return res.status(400).json({ msg: 'Dados do atleta incompletos.' });
    }

    const metodoPagamento = await MetodoPagamento.findOne({ where: { id: metodoPagamentoId, ativo: true } });
    if (!metodoPagamento) return res.status(400).json({ msg: 'Método de pagamento inválido ou inativo.' });

    const eventoIds = [...new Set(inscricoes.map(i => Number(i.evento_id)))];
    const modIds = [...new Set(inscricoes.map(i => Number(i.competicao_modalidade_id)))];
    const vinculos = await CompeticaoEventoModalidade.findAll({
      where: {
        evento_id: { [Op.in]: eventoIds },
        competicao_modalidade_id: { [Op.in]: modIds },
      }
    });
    const taxaByKey = new Map((vinculos || []).map(v => [`${v.evento_id}:${v.competicao_modalidade_id}`, Number(v.taxa_inscricao || 0)]));

    const itens = [];
    let total = 0;
    for (const ins of inscricoes) {
      const taxa = taxaByKey.get(`${ins.evento_id}:${ins.competicao_modalidade_id}`) ?? Number(ins.evento?.taxa_inscricao ?? 0);
      const valor = Number(taxa || 0);
      if (valor <= 0) return res.status(400).json({ msg: 'Há item com taxa 0 neste checkout.' });
      total += valor;
      itens.push({
        competicao_inscricao_id: ins.id,
        descricao: `${ins.evento?.nome || 'Evento'} - ${ins.competicaoModalidade?.nome || 'Submodalidade'}`,
        valor,
      });
    }

    const valorCentavosTotal = Math.round(total * 100);
    if (valorCentavosTotal <= 0) return res.status(400).json({ msg: 'Total inválido.' });

    const cpfDigits = String(atleta.cpf || '').replace(/\D/g, '');
    const cepDigits = String(atleta.cep || '').replace(/\D/g, '');
    const metodoConfig = metodoPagamento.configuracao || {};

    const t = await db.sequelize.transaction();
    let pagamento;
    try {
      pagamento = await Pagamento.create({
        tipo: 'competicao',
        atleta_id: req.usuario.id,
        metodo_pagamento_id: metodoPagamento.id,
        valor_total: total,
        valor_pago: total,
        status: 'pendente',
      }, { transaction: t });

      await PagamentoItem.bulkCreate(
        itens.map(i => ({
          pagamento_id: pagamento.id,
          competicao_inscricao_id: i.competicao_inscricao_id,
          descricao: i.descricao,
          valor: i.valor,
        })),
        { transaction: t }
      );
      await t.commit();
    } catch (e) {
      await t.rollback();
      console.error('Erro ao criar pagamento/itens:', e);
      return res.status(500).json({ msg: 'Erro ao criar cobrança.' });
    }

    const provider = (safeProviderFromMetodo(metodoPagamento) || (String(metodoPagamento.nome || '').toLowerCase().includes('cora') ? 'cora' : 'pagbank'));

    const finalizar = async (gatewayData) => {
      await pagamento.update({
        id_transacao_gateway: gatewayData.idTransacaoGateway,
        qr_code_pix: gatewayData.qrCodeText || null,
        linha_digitavel_boleto: gatewayData.linhaDigitavel || null,
      });
      return res.status(201).json({
        pagamentoId: pagamento.id,
        total,
        metodoPagamento: { id: metodoPagamento.id, nome: metodoPagamento.nome, provider },
        pix: { qrCodeText: gatewayData.qrCodeText || null },
        boleto: { linhaDigitavel: gatewayData.linhaDigitavel || null },
        status: pagamento.status,
        itens
      });
    };

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
          return res.status(400).json({ msg: `Para pagar via Cora, atualize seu endereço. Faltando: ${missing.join(', ')}.` });
        }

        const dueDays = Number(metodoConfig.dueDays ?? 1);
        const dueDate = new Date(Date.now() + (Math.max(0, dueDays) * 86400000));
        const dueDateStr = dueDate.toISOString().slice(0, 10);
        const numero = metodoConfig.address_number || parseAddressNumber(atleta.logradouro) || 'S/N';
        const paymentForms = Array.isArray(metodoConfig.payment_forms) ? metodoConfig.payment_forms : ['BANK_SLIP', 'PIX'];

        const payloadCora = {
          code: `CONFBEC_PAG_${pagamento.id}`,
          payment_forms: paymentForms,
          customer: {
            name: atleta.nome_completo,
            email: atleta.usuario.email,
            document: { identity: cpfDigits, type: 'CPF' },
            address: {
              street: atleta.logradouro,
              number: String(numero),
              district: atleta.bairro,
              city: atleta.cidade,
              state: atleta.estado,
              complement: metodoConfig.address_complement || 'N/A',
              zip_code: cepDigits
            }
          },
          services: itens.map((it) => ({
            name: 'Inscrição Competição',
            description: it.descricao,
            amount: Math.round(Number(it.valor) * 100),
          })),
          payment_terms: { due_date: dueDateStr }
        };

        const idempotencyKey = crypto.randomUUID();
        const coraResp = await coraClient.createInvoice(payloadCora, { idempotencyKey });
        
        const idTransacaoGateway = coraResp?.id || coraResp?.invoice_id || coraResp?.payment?.id || null;
        const linhaDigitavel = coraResp?.bank_slip?.digitable_line || coraResp?.digitable_line || coraResp?.boleto?.digitable_line || null;
        const qrCodeText = coraResp?.pix?.emv || coraResp?.pix?.qr_code || coraResp?.pix?.payload || coraResp?.qr_code || null;

        if (!idTransacaoGateway) throw new Error('Resposta da Cora sem ID.');
        return await finalizar({ idTransacaoGateway, qrCodeText, linhaDigitavel });
      }

      // Default: PagBank
      const appUrl = process.env.APP_PUBLIC_URL;
      const notificationUrls = [];
      if (appUrl) notificationUrls.push(`${appUrl}/api/pagamentos/webhook/pagbank`);

      const payloadPagBank = {
        reference_id: `CONFBEC_PAG_${pagamento.id}`,
        customer: {
          name: atleta.nome_completo,
          email: atleta.usuario.email,
          tax_id: cpfDigits,
        },
        items: itens.map((it) => ({
          reference_id: `INSCRICAO_${it.competicao_inscricao_id}`,
          name: it.descricao,
          quantity: 1,
          unit_amount: Math.round(Number(it.valor) * 100),
        })),
        qr_codes: [{ amount: { value: valorCentavosTotal } }],
        notification_urls: notificationUrls,
      };

      const respPagBank = await pagbankClient.createOrderPix(payloadPagBank);
      const idTransacaoGateway = respPagBank.data?.id;
      const qrCodeText = respPagBank.data?.qr_codes?.[0]?.text;
      if (!idTransacaoGateway || !qrCodeText) throw new Error('Resposta inválida do PagBank.');

      return await finalizar({ idTransacaoGateway, qrCodeText, linhaDigitavel: null });
    } catch (gatewayErr) {
      console.error('Erro no gateway (checkout lote):', gatewayErr);
      return res.status(500).json({ msg: 'Falha ao gerar cobrança no gateway.' });
    }
  } catch (err) {
    console.error('Erro no checkout por lote:', err);
    return res.status(500).json({ msg: 'Erro no checkout.' });
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
        {
          model: PagamentoItem,
          as: 'pagamentoItens',
          required: false,
          include: [
            {
              model: Pagamento,
              as: 'pagamento',
              include: [
                { model: MetodoPagamento, as: 'metodoPagamento', required: false, attributes: ['id', 'nome', 'configuracao'] },
                { model: PagamentoItem, as: 'itens', required: false },
              ]
            }
          ]
        },
      ]
    });

    const payload = (inscricoes || []).map((i) => {
      const j = i.toJSON();
      j.divisao_peso_label = divisaoPesoLabel(j.divisao_peso);
      j.fight_config = fightConfigByModalidadeCode(j.competicaoModalidade?.code, j.idade_anos);
      return j;
    });

    res.json(payload);
  } catch (err) {
    console.error('Erro ao listar minhas inscrições:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.getInscricao = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });

    const { inscricaoId } = req.params;
    const inscricao = await CompeticaoInscricao.findByPk(inscricaoId, {
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
        {
          model: PagamentoItem,
          as: 'pagamentoItens',
          required: false,
          include: [{ model: Pagamento, as: 'pagamento', include: [{ model: MetodoPagamento, as: 'metodoPagamento', required: false }] }]
        }
      ]
    });

    if (!inscricao) return res.status(404).json({ msg: 'Inscrição não encontrada.' });

    if (req.usuario.tipo === 'atleta' && Number(inscricao.atleta_id) !== Number(req.usuario.id)) {
      return res.status(403).json({ msg: 'Acesso negado.' });
    }

    const j = inscricao.toJSON();
    j.divisao_peso_label = divisaoPesoLabel(j.divisao_peso);
    j.fight_config = fightConfigByModalidadeCode(j.competicaoModalidade?.code, j.idade_anos);
    return res.json(j);
  } catch (err) {
    console.error('Erro ao obter inscrição:', err);
    return res.status(500).send('Erro no servidor.');
  }
};

exports.atualizarInscricaoAtleta = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const { inscricaoId } = req.params;
    const inscricao = await CompeticaoInscricao.findOne({ where: { id: inscricaoId, atleta_id: req.usuario.id } });
    if (!inscricao) return res.status(404).json({ msg: 'Inscrição não encontrada.' });

    if (inscricao.status !== 'PENDENTE_PAGAMENTO') {
      return res.status(400).json({ msg: 'Inscrição não pode ser alterada neste status.' });
    }

    const allowed = ['peso_kg', 'categoria_combate'];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];

    if ('peso_kg' in patch) {
      const evento = await CompeticaoEvento.findByPk(inscricao.evento_id);
      const atleta = await getAtletaWithUsuario(req.usuario.id);
      const idadeAnos = calcAgeYears(atleta.data_nascimento, evento.data_evento);
      const grupoEtario = grupoEtarioFromAge(idadeAnos);
      const pesoCheck = validatePesoMinimo(grupoEtario, patch.peso_kg);
      if (!pesoCheck.ok) return res.status(400).json({ msg: pesoCheck.msg });
      const divPeso = divisaoPesoFromGrupo(grupoEtario, patch.peso_kg);
      if (!divPeso) return res.status(400).json({ msg: 'Não foi possível calcular a divisão de peso.' });
      patch.divisao_peso = divPeso;
    }

    if ('categoria_combate' in patch) {
      const catCheck = validateCategoriaCombate(patch.categoria_combate, null);
      if (!catCheck.ok) return res.status(400).json({ msg: catCheck.msg });
    }

    await inscricao.update(patch);
    return res.json(inscricao);
  } catch (err) {
    console.error('Erro ao atualizar inscrição:', err);
    return res.status(500).send('Erro no servidor.');
  }
};

exports.cancelarInscricao = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const { inscricaoId } = req.params;
    const inscricao = await CompeticaoInscricao.findOne({ where: { id: inscricaoId, atleta_id: req.usuario.id } });
    if (!inscricao) return res.status(404).json({ msg: 'Inscrição não encontrada.' });

    if (!['PENDENTE_PAGAMENTO', 'AGUARDANDO_AUTORIZACAO'].includes(inscricao.status)) {
      return res.status(400).json({ msg: 'Inscrição não pode ser cancelada neste status.' });
    }

    await inscricao.update({ status: 'CANCELADA' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao cancelar inscrição:', err);
    return res.status(500).send('Erro no servidor.');
  }
};

exports.minhasFaturas = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
    if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

    const pagamentos = await Pagamento.findAll({
      where: { tipo: 'competicao', atleta_id: req.usuario.id },
      order: [['createdAt', 'DESC']],
      include: [
        { model: PagamentoItem, as: 'itens' },
        { model: MetodoPagamento, as: 'metodoPagamento', required: false },
      ]
    });

    return res.json(pagamentos);
  } catch (err) {
    console.error('Erro ao listar minhas faturas:', err);
    return res.status(500).json({ msg: 'Erro ao listar faturas.' });
  }
};

exports.getFatura = async (req, res) => {
  try {
    if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });

    const { pagamentoId } = req.params;
    const pagamento = await Pagamento.findByPk(pagamentoId, {
      include: [
        { model: PagamentoItem, as: 'itens' },
        { model: MetodoPagamento, as: 'metodoPagamento', required: false },
      ]
    });

    if (!pagamento) return res.status(404).json({ msg: 'Fatura não encontrada.' });
    if (req.usuario.tipo === 'atleta' && Number(pagamento.atleta_id) !== Number(req.usuario.id)) {
      return res.status(403).json({ msg: 'Acesso negado.' });
    }

    return res.json(pagamento);
  } catch (err) {
    console.error('Erro ao obter fatura:', err);
    return res.status(500).json({ msg: 'Erro ao obter fatura.' });
  }
};

// Restaurando a função completa com toda a lógica original
exports.criarCobrancaInscricao = async (req, res) => {
  const { inscricaoId } = req.params;
  const { metodoPagamentoId, forceNew } = req.body || {};

  if (!req.usuario) return res.status(401).json({ msg: 'Não autenticado.' });
  if (req.usuario.tipo !== 'atleta') return res.status(403).json({ msg: 'Apenas atletas.' });

  try {
    const inscricao = await CompeticaoInscricao.findOne({
      where: {
        id: inscricaoId,
        atleta_id: req.usuario.id,
        status: 'PENDENTE_PAGAMENTO'
      },
      include: [
        { model: CompeticaoEvento, as: 'evento' },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
      ]
    });

    if (!inscricao) {
      return res.status(404).json({ msg: 'Inscrição não encontrada ou não está pendente de pagamento.' });
    }

    const evento = inscricao.evento;
    let taxa = 0;
    try {
      const vinculo = await CompeticaoEventoModalidade.findOne({
        where: {
          evento_id: inscricao.evento_id,
          competicao_modalidade_id: inscricao.competicao_modalidade_id,
        }
      });
      taxa = Number(vinculo?.taxa_inscricao ?? evento?.taxa_inscricao ?? 0);
    } catch {
      taxa = Number(evento?.taxa_inscricao ?? 0);
    }
    if (taxa <= 0) {
      return res.status(400).json({ msg: 'Este evento não possui taxa de inscrição.' });
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

    // Se já existe pagamento pendente e não forçou novo
    if (!forceNew) {
      const pendente = await Pagamento.findOne({
        where: { competicao_inscricao_id: inscricaoId, status: 'pendente' },
        order: [['createdAt', 'DESC']],
        include: [{ model: MetodoPagamento, PagamentoItem, as: 'metodoPagamento', attributes: ['id', 'nome', 'configuracao'] }]
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

    const valorCentavos = Math.round(taxa * 100);
    const cpfDigits = String(atleta.cpf || '').replace(/\D/g, '');
    const cepDigits = String(atleta.cep || '').replace(/\D/g, '');

    const metodoConfig = (metodoPagamento.configuracao && typeof metodoPagamento.configuracao === 'object')
      ? metodoPagamento.configuracao
      : {};

    // Cria pagamento local
    let pagamento = await Pagamento.create({
      competicao_inscricao_id: inscricaoId,
      metodo_pagamento_id: metodoPagamento.id,
      valor_pago: taxa,
      status: 'pendente',
    });

    const inferProvider = () => {
      const p = safeProviderFromMetodo(metodoPagamento);
      if (p) return p;
      const nome = (metodoPagamento.nome || '').toLowerCase();
      if (nome.includes('cora')) return 'cora';
      if (nome.includes('pagbank') || nome.includes('pagseguro')) return 'pagbank';
      if (nome === 'pix') return 'pagbank';
      return null;
    };

    let provider = inferProvider() || 'pagbank';
    let fallbackUsed = false;

    const finalizar = async (metodoFinal, providerFinal, gatewayData) => {
      await pagamento.update({
        metodo_pagamento_id: metodoFinal.id,
        valor_pago: taxa,
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

        const dueDays = Number(metodoConfig.dueDays ?? 1);
        const dueDate = new Date(Date.now() + (Math.max(0, dueDays) * 86400000));
        const dueDateStr = dueDate.toISOString().slice(0, 10);

        const paymentForms = Array.isArray(metodoConfig.payment_forms)
          ? metodoConfig.payment_forms
          : ['BANK_SLIP', 'PIX'];

        const numero = metodoConfig.address_number || parseAddressNumber(atleta.logradouro) || 'S/N';

        const payloadCora = {
          code: `CONFBEC_PAG_${pagamento.id}`,
          payment_forms: paymentForms,
          customer: {
            name: atleta.nome_completo,
            email: atleta.usuario.email,
            document: { identity: cpfDigits, type: 'CPF' },
            address: {
              street: atleta.logradouro,
              number: String(numero),
              district: atleta.bairro,
              city: atleta.cidade,
              state: atleta.estado,
              complement: metodoConfig.address_complement || 'N/A',
              zip_code: cepDigits
            }
          },
          services: [{
            name: `Inscrição ${evento?.nome || 'Competição'}`,
            description: `Inscrição #${inscricao.id} - ${inscricao.competicaoModalidade?.nome || ''}`.trim(),
            amount: valorCentavos,
          }],
          payment_terms: { due_date: dueDateStr }
        };

        const idempotencyKey = crypto.randomUUID();
        const coraResp = await coraClient.createInvoice(payloadCora, { idempotencyKey });

        const idTransacaoGateway = coraResp?.id || coraResp?.invoice_id || coraResp?.payment?.id || null;
        const linhaDigitavel =
          coraResp?.bank_slip?.digitable_line ||
          coraResp?.digitable_line ||
          coraResp?.boleto?.digitable_line ||
          null;
        const qrCodeText =
          coraResp?.pix?.emv ||
          coraResp?.pix?.qr_code ||
          coraResp?.pix?.payload ||
          coraResp?.qr_code ||
          null;

        if (!idTransacaoGateway) throw new Error('Resposta da Cora sem ID.');

        return await finalizar(metodoPagamento, 'cora', { idTransacaoGateway, qrCodeText, linhaDigitavel });
      }

      // Default: PagBank
      provider = 'pagbank';
      const appUrl = process.env.APP_PUBLIC_URL;
      const notificationUrls = [];
      if (appUrl) notificationUrls.push(`${appUrl}/api/pagamentos/webhook/pagbank`);

      const payloadPagBank = {
        reference_id: `CONFBEC_PAG_${pagamento.id}`,
        customer: {
          name: atleta.nome_completo,
          email: atleta.usuario.email,
          tax_id: cpfDigits,
        },
        items: [{
          reference_id: `INSCRICAO_${inscricao.id}`,
          name: `Inscrição ${evento?.nome || 'Competição'}`,
          quantity: 1,
          unit_amount: valorCentavos,
        }],
        qr_codes: [{ amount: { value: valorCentavos } }],
        notification_urls: notificationUrls,
      };

      const respPagBank = await pagbankClient.createOrderPix(payloadPagBank);
      const idTransacaoGateway = respPagBank.data?.id;
      const qrCodeText = respPagBank.data?.qr_codes?.[0]?.text;
      if (!idTransacaoGateway || !qrCodeText) throw new Error('Resposta inválida do PagBank.');

      return await finalizar(metodoPagamento, 'pagbank', { idTransacaoGateway, qrCodeText, linhaDigitavel: null });
    } catch (gatewayErr) {
      // Fallback: se Cora falhar, tenta PagBank
      const coraFailed = provider === 'cora';
      const fallbackMetodo = metodosAtivos.find(m => {
        const p = safeProviderFromMetodo(m) || (typeof m.nome === 'string' ? m.nome.toLowerCase() : '');
        return p.includes('pagbank') || p.includes('pagseguro') || p === 'pagbank' || p === 'pix';
      });

      if (coraFailed && fallbackMetodo) {
        fallbackUsed = true;
        try {
          const appUrl = process.env.APP_PUBLIC_URL;
          const notificationUrls = [];
          if (appUrl) notificationUrls.push(`${appUrl}/api/pagamentos/webhook/pagbank`);

          const payloadPagBank = {
            reference_id: `CONFBEC_PAG_${pagamento.id}`,
            customer: {
              name: atleta.nome_completo,
              email: atleta.usuario.email,
              tax_id: cpfDigits,
            },
            items: [{
              reference_id: `INSCRICAO_${inscricao.id}`,
              name: `Inscrição ${evento?.nome || 'Competição'}`,
              quantity: 1,
              unit_amount: valorCentavos,
            }],
            qr_codes: [{ amount: { value: valorCentavos } }],
            notification_urls: notificationUrls,
          };

          const respPagBank = await pagbankClient.createOrderPix(payloadPagBank);
          const idTransacaoGateway = respPagBank.data?.id;
          const qrCodeText = respPagBank.data?.qr_codes?.[0]?.text;
          if (!idTransacaoGateway || !qrCodeText) throw new Error('Resposta inválida do PagBank (fallback).');
          return await finalizar(fallbackMetodo, 'pagbank', { idTransacaoGateway, qrCodeText, linhaDigitavel: null });
        } catch (fallbackErr) {
          console.error('Fallback PagBank falhou:', fallbackErr.response?.data || fallbackErr.message);
        }
      }

      console.error('Falha ao criar cobrança inscrição:', gatewayErr.response?.data || gatewayErr.message);
      await pagamento.destroy();
      return res.status(502).json({ msg: 'Falha ao se comunicar com o gateway de pagamento.' });
    }

  } catch (err) {
    console.error('Erro ao criar cobrança da inscrição:', err);
    res.status(500).send('Erro no servidor.');
  }
};

// =========================
// Admin: Inscrições e autorizações
// =========================

exports.listarInscricoesEvento = async (req, res) => {
  try {
    const inscricoes = await CompeticaoInscricao.findAll({
      where: { evento_id: req.params.eventoId },
      order: [['created_at', 'DESC']],
      include: [
        { model: Atleta, as: 'atleta', attributes: ['id', 'nome_completo', 'cpf'] },
        { model: CompeticaoModalidade, as: 'competicaoModalidade' },
        { model: Filiacao, as: 'filiacao', include: [{ model: Modalidade, as: 'modalidade', attributes: ['id', 'nome'] }] },
        { model: Pagamento, as: 'pagamentos' },
      ]
    });
    res.json(inscricoes);
  } catch (err) {
    console.error('Erro ao listar inscrições:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.listarAutorizacoesEvento = async (req, res) => {
  try {
    const autorizacoes = await CompeticaoAutorizacao.findAll({
      where: { evento_id: req.params.eventoId },
      order: [['requested_at', 'DESC']],
      include: [{ model: Atleta, as: 'atleta', attributes: ['id', 'nome_completo', 'cpf'] }]
    });
    res.json(autorizacoes);
  } catch (err) {
    console.error('Erro ao listar autorizações:', err);
    res.status(500).send('Erro no servidor.');
  }
};

exports.revisarAutorizacao = async (req, res) => {
  try {
    const { aprovado, notes } = req.body || {};
    if (aprovado === undefined) return res.status(400).json({ msg: 'Campo "aprovado" é obrigatório.' });

    const auth = await CompeticaoAutorizacao.findByPk(req.params.autorizacaoId);
    if (!auth) return res.status(404).json({ msg: 'Autorização não encontrada.' });

    const novoStatus = aprovado ? 'APROVADA' : 'NEGADA';
    await auth.update({
      status: novoStatus,
      notes: notes ?? null,
      approved_at: new Date(),
    });

    const inscricoes = await CompeticaoInscricao.findAll({
      where: {
        evento_id: auth.evento_id,
        atleta_id: auth.atleta_id,
        status: 'AGUARDANDO_AUTORIZACAO'
      }
    });

    for (const insc of inscricoes) {
      if (aprovado) {
        await insc.update({ status: 'CONFIRMADA', motivo_bloqueio: null });
      } else {
        await insc.update({ status: 'BLOQUEADA', motivo_bloqueio: 'Autorização negada.' });
      }
    }

    res.json({ autorizacao: auth, inscricoesAtualizadas: inscricoes.length });
  } catch (err) {
    console.error('Erro ao revisar autorização:', err);
    res.status(500).send('Erro no servidor.');
  }
};