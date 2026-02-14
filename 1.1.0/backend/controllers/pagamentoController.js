// --- INÍCIO DO ARQUIVO ---
// /controllers/pagamentoController.js

const axios = require('axios'); // Importa o Axios
const crypto = require('crypto');
const db = require('../models');
const coraClient = require('../services/coraClient');
const pagbankClient = require('../services/pagbankClient');

// Garante que todos os modelos necessários estão importados
const {
  Filiacao,
  MetodoPagamento,
  Pagamento,
  Usuario,
  Atleta,
  Modalidade,
  CompeticaoInscricao,
  CompeticaoEvento,
  CompeticaoModalidade,
  CompeticaoAutorizacao,
} = db;

const { requiresAutorizacaoEspecial, authorityByEscopo } = require('../services/competicaoRules');

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function safeProviderFromMetodo(metodo) {
  const cfg = metodo?.configuracao;
  const provider = (cfg && typeof cfg === 'object') ? cfg.provider : null;
  return (typeof provider === 'string' ? provider.toLowerCase() : null);
}

function parseAddressNumber(logradouro) {
  if (!logradouro || typeof logradouro !== 'string') return null;
  // tenta pegar o último número (ex: "Rua X, 123" ou "Rua X 123")
  const m = logradouro.match(/(\d{1,6})\s*$/);
  return m ? m[1] : null;
}

/**
 * @desc    Atleta cria uma cobrança (PIX) para uma filiação pendente
 * @route   POST /api/pagamentos/criar-cobranca/:filiacaoId
 * @access  Privado (Atleta dono)
 */

exports.getPagamentoById = async (req, res) => {
  const { pagamentoId } = req.params;
  const usuarioId = req.usuario.id; // Vem do middleware 'proteger'

  console.log(`[PagamentoCtrl] Buscando detalhes do pagamento ID: ${pagamentoId} para usuário ID: ${usuarioId}`);

  try {
    const pagamento = await Pagamento.findByPk(pagamentoId, {
      include: [
        {
          model: Filiacao,
          as: 'filiacao',
          attributes: ['atleta_id'],
          required: false,
        },
        {
          model: CompeticaoInscricao,
          as: 'competicaoInscricao',
          attributes: ['id', 'atleta_id', 'evento_id', 'competicao_modalidade_id'],
          required: false,
          include: [
            { model: CompeticaoEvento, as: 'evento', attributes: ['id', 'nome'] },
            { model: CompeticaoModalidade, as: 'competicaoModalidade', attributes: ['id', 'nome'] }
          ]
        },
        {
          model: MetodoPagamento,
          as: 'metodoPagamento',
          attributes: ['id', 'nome', 'configuracao']
        }
      ]
    });

    if (!pagamento) {
      console.log("[PagamentoCtrl] Falha: Pagamento não encontrado.");
      return res.status(404).json({ msg: 'Pagamento não encontrado.' });
    }

    // Verifica Permissão: O usuário logado é o atleta dono (filiação OU inscrição) OU é um admin
    const ownerAtletaId = pagamento.filiacao?.atleta_id || pagamento.competicaoInscricao?.atleta_id || null;
    const isOwner = ownerAtletaId === usuarioId;
    const isAdmin = req.usuario.tipo === 'admin';

    if (!isOwner && !isAdmin) {
      console.log("[PagamentoCtrl] Falha: Acesso negado ao pagamento.");
      return res.status(403).json({ msg: 'Acesso negado a este pagamento.' });
    }

    const provider = safeProviderFromMetodo(pagamento.metodoPagamento) || null;

    const context = pagamento.filiacao_id ? 'filiacao' : (pagamento.competicao_inscricao_id ? 'competicao' : 'outro');
    const descricao = context === 'competicao'
      ? `Inscrição #${pagamento.competicaoInscricao?.id || pagamento.competicao_inscricao_id}`
      : 'Taxa de Filiação';

    // Retorna os dados necessários para o front-end exibir
    res.status(200).json({
      pagamentoId: pagamento.id,
      filiacaoId: pagamento.filiacao_id,
      inscricaoCompeticaoId: pagamento.competicao_inscricao_id || null,
      context,
      descricao,
      metodoPagamento: {
        id: pagamento.metodoPagamento?.id,
        nome: pagamento.metodoPagamento?.nome,
        provider
      },
      pix: {
        qrCodeText: pagamento.qr_code_pix || null
      },
      boleto: {
        linhaDigitavel: pagamento.linha_digitavel_boleto || null
      },
      valor: pagamento.valor_pago,
      status: pagamento.status
    });

  } catch (err) {
    console.error(`ERRO FATAL em GET /api/pagamentos/${pagamentoId}:`, err);
    res.status(500).send('Erro interno no servidor ao buscar pagamento.');
  }
};

exports.criarCobranca = async (req, res) => {
  const { filiacaoId } = req.params;
  const { metodoPagamentoId, forceNew } = req.body || {};
  
  // Verifica se req.usuario existe (do middleware 'proteger')
  if (!req.usuario) {
      console.error("ERRO FATAL criarCobranca: req.usuario não definido!");
      return res.status(500).send('Erro interno: Autenticação falhou.');
  }
  const atletaId = req.usuario.id;

  console.log(`[PagamentoCtrl] Iniciando criação de cobrança para filiação ID: ${filiacaoId} pelo atleta ID: ${atletaId}`);

  try {
    // 1. Validar a Filiação
    const filiacao = await Filiacao.findOne({
      where: {
        id: filiacaoId,
        atleta_id: atletaId,
        status: 'pendente_pagamento', // SÓ pode pagar se estiver pendente
      },
      include: [
        {
          model: Atleta,
          as: 'atleta',
          attributes: ['nome_completo', 'cpf', 'cep', 'logradouro', 'bairro', 'cidade', 'estado'],
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['email']
          }]
        },
        { model: Modalidade, as: 'modalidade', attributes: ['nome'] }
      ]
    });

    if (!filiacao) {
      console.log("[PagamentoCtrl] Falha: Filiação não encontrada ou não está pendente de pagamento.");
      // --- CORREÇÃO DE SINTAXE (404 em vez de 4.) ---
      return res.status(404).json({ msg: 'Filiação não encontrada ou não está aguardando pagamento.' });
      // ----------------------------------------
    }
    
    // Verifica se os dados necessários foram incluídos
    if (!filiacao.atleta || !filiacao.atleta.usuario) {
         console.error("[PagamentoCtrl] Falha: Inclusão (include) do Atleta ou Usuario falhou.");
         return res.status(500).json({ msg: 'Erro ao buscar dados completos do atleta.' });
    }

    // 2. Buscar método de pagamento (Cora principal; PagBank fallback)
    const metodosAtivos = await MetodoPagamento.findAll({ where: { ativo: true } });

    if (!metodosAtivos || metodosAtivos.length === 0) {
      return res.status(400).json({ msg: 'Nenhum método de pagamento ativo configurado. Contate o administrador.' });
    }

    let metodoPagamento = null;
    if (metodoPagamentoId) {
      metodoPagamento = metodosAtivos.find(m => String(m.id) === String(metodoPagamentoId));
      if (!metodoPagamento) {
        return res.status(400).json({ msg: 'Método de pagamento inválido ou inativo.' });
      }
    } else {
      const byProvider = (prov) => metodosAtivos.find(m => {
        const p = safeProviderFromMetodo(m) || (typeof m.nome === 'string' ? m.nome.toLowerCase() : '');
        return p.includes(prov);
      });
      metodoPagamento = byProvider('cora') || byProvider('pagbank') || metodosAtivos[0];
    }

    if (!metodoPagamento?.taxa_filiacao) {
      return res.status(400).json({ msg: 'Método de pagamento selecionado não possui taxa de filiação configurada.' });
    }

    // Se já existe um pagamento pendente recente e o usuário não forçou um novo, retorna o último
    if (!forceNew) {
      const pendente = await Pagamento.findOne({
        where: { filiacao_id: filiacaoId, status: 'pendente' },
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

    const valorCobradoCentavos = Math.round(Number(metodoPagamento.taxa_filiacao) * 100);
    console.log(`[PagamentoCtrl] Valor a ser cobrado: ${valorCobradoCentavos} centavos.`);

    // 3. Criar o registro de Pagamento local (status 'pendente')
    console.log("[PagamentoCtrl] Criando registro de pagamento local (pendente)...");
    let pagamento = await Pagamento.create({
      filiacao_id: filiacaoId,
      metodo_pagamento_id: metodoPagamento.id,
      valor_pago: metodoPagamento.taxa_filiacao,
      status: 'pendente',
    });
    console.log(`[PagamentoCtrl] Pagamento local criado com ID: ${pagamento.id}`);

    const cpfDigits = String(filiacao.atleta.cpf || '').replace(/\D/g, '');
    const cepDigits = String(filiacao.atleta.cep || '').replace(/\D/g, '');

    const metodoConfig = (metodoPagamento.configuracao && typeof metodoPagamento.configuracao === 'object')
      ? metodoPagamento.configuracao
      : {};

    const inferProvider = () => {
      const p = safeProviderFromMetodo(metodoPagamento);
      if (p) return p;
      const nome = (metodoPagamento.nome || '').toLowerCase();
      if (nome.includes('cora')) return 'cora';
      if (nome.includes('pagbank') || nome.includes('pagseguro')) return 'pagbank';
      // compat: método antigo "PIX" -> PagBank
      if (nome === 'pix') return 'pagbank';
      return null;
    };

    let provider = inferProvider();
    let fallbackUsed = false;

    const finalizar = async (metodoFinal, providerFinal, gatewayData) => {
      await pagamento.update({
        metodo_pagamento_id: metodoFinal.id,
        valor_pago: metodoFinal.taxa_filiacao,
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
        // Validação mínima de endereço (Cora exige endereço do pagador)
        const missing = [];
        if (!filiacao.atleta.logradouro) missing.push('logradouro');
        if (!filiacao.atleta.bairro) missing.push('bairro');
        if (!filiacao.atleta.cidade) missing.push('cidade');
        if (!filiacao.atleta.estado) missing.push('estado');
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

        const logradouro = filiacao.atleta.logradouro;
        const numero = metodoConfig.address_number || parseAddressNumber(logradouro) || 'S/N';

        const payloadCora = {
          code: `CONFBEC_PAG_${pagamento.id}`,
          payment_forms: paymentForms,
          customer: {
            name: filiacao.atleta.nome_completo,
            email: filiacao.atleta.usuario.email,
            document: {
              identity: cpfDigits,
              type: 'CPF'
            },
            address: {
              street: logradouro,
              number: String(numero),
              district: filiacao.atleta.bairro,
              city: filiacao.atleta.cidade,
              state: filiacao.atleta.estado,
              complement: metodoConfig.address_complement || 'N/A',
              zip_code: cepDigits
            }
          },
          services: [{
            name: `Taxa de Filiação ${filiacao.modalidade?.nome || 'CONFBEC'}`,
            description: `Filiação #${filiacao.id}`,
            amount: valorCobradoCentavos
          }],
          payment_terms: {
            due_date: dueDateStr
          }
        };

        const idempotencyKey = crypto.randomUUID();
        console.log('[PagamentoCtrl] Chamando Cora (POST /v2/invoices)...');
        const coraResp = await coraClient.createInvoice(payloadCora, { idempotencyKey });

        const idTransacaoGateway = coraResp?.id || coraResp?.invoice_id || coraResp?.payment?.id || null;
        const linhaDigitavel =
          coraResp?.bank_slip?.digitable_line ||
          coraResp?.digitable_line ||
          coraResp?.boleto?.digitable_line ||
          coraResp?.boleto?.digitable_line ||
          null;

        const qrCodeText =
          coraResp?.pix?.emv ||
          coraResp?.pix?.qr_code ||
          coraResp?.pix?.payload ||
          coraResp?.qr_code ||
          null;

        if (!idTransacaoGateway) {
          throw new Error('Resposta da Cora sem ID de transação/invoice.');
        }

        return await finalizar(metodoPagamento, 'cora', { idTransacaoGateway, qrCodeText, linhaDigitavel });
      }

      // Default: PagBank
      provider = 'pagbank';
      const appUrl = process.env.APP_PUBLIC_URL;
      const notificationUrls = [];
      if (appUrl) notificationUrls.push(`${appUrl}/api/pagamentos/webhook/pagbank`);

      const customer = {
        name: filiacao.atleta.nome_completo,
        email: filiacao.atleta.usuario.email,
        tax_id: cpfDigits,
      };

      const items = [{
        reference_id: `FILIACAO_${filiacao.id}`,
        name: `Taxa de Filiação ${filiacao.modalidade?.nome || 'CONFBEC'}`,
        quantity: 1,
        unit_amount: valorCobradoCentavos,
      }];

      const payloadPagBank = {
        reference_id: `CONFBEC_PAG_${pagamento.id}`,
        customer,
        items,
        qr_codes: [{ amount: { value: valorCobradoCentavos } }],
        notification_urls: notificationUrls,
      };

      console.log('[PagamentoCtrl] Chamando PagBank (POST /orders)...');
      const respPagBank = await pagbankClient.createOrderPix(payloadPagBank);
      const idTransacaoGateway = respPagBank.data?.id;
      const qrCodeText = respPagBank.data?.qr_codes?.[0]?.text;
      const linhaDigitavel = null;

      if (!idTransacaoGateway || !qrCodeText) {
        throw new Error('Resposta inválida do PagBank (sem ID ou QR Code).');
      }

      return await finalizar(metodoPagamento, 'pagbank', { idTransacaoGateway, qrCodeText, linhaDigitavel });
    } catch (gatewayErr) {
      // Fallback: se Cora falhar, tenta PagBank
      const coraFailed = provider === 'cora';
      const fallbackMetodo = metodosAtivos.find(m => {
        const p = safeProviderFromMetodo(m) || (typeof m.nome === 'string' ? m.nome.toLowerCase() : '');
        return p.includes('pagbank') || p.includes('pagseguro') || p === 'pagbank' || p === 'pix';
      });

      if (coraFailed && fallbackMetodo) {
        console.warn('[PagamentoCtrl] Cora indisponível/erro. Tentando fallback via PagBank...', gatewayErr.response?.data || gatewayErr.message);
        fallbackUsed = true;

        try {
          const valorFallbackCentavos = Math.round(Number(fallbackMetodo.taxa_filiacao) * 100);
          const cpfDigits2 = cpfDigits;

          const appUrl = process.env.APP_PUBLIC_URL;
          const notificationUrls = [];
          if (appUrl) notificationUrls.push(`${appUrl}/api/pagamentos/webhook/pagbank`);

          const payloadPagBank = {
            reference_id: `CONFBEC_PAG_${pagamento.id}`,
            customer: {
              name: filiacao.atleta.nome_completo,
              email: filiacao.atleta.usuario.email,
              tax_id: cpfDigits2,
            },
            items: [{
              reference_id: `FILIACAO_${filiacao.id}`,
              name: `Taxa de Filiação ${filiacao.modalidade?.nome || 'CONFBEC'}`,
              quantity: 1,
              unit_amount: valorFallbackCentavos,
            }],
            qr_codes: [{ amount: { value: valorFallbackCentavos } }],
            notification_urls: notificationUrls,
          };

          const respPagBank = await pagbankClient.createOrderPix(payloadPagBank);
          const idTransacaoGateway = respPagBank.data?.id;
          const qrCodeText = respPagBank.data?.qr_codes?.[0]?.text;
          if (!idTransacaoGateway || !qrCodeText) {
            throw new Error('Resposta inválida do PagBank (fallback).');
          }

          return await finalizar(fallbackMetodo, 'pagbank', { idTransacaoGateway, qrCodeText, linhaDigitavel: null });
        } catch (fallbackErr) {
          console.error('[PagamentoCtrl] Fallback PagBank também falhou:', fallbackErr.response?.data || fallbackErr.message);
        }
      }

      console.error('[PagamentoCtrl] Falha ao criar cobrança no gateway:', gatewayErr.response?.data || gatewayErr.message);
      await pagamento.destroy();
      return res.status(502).json({ msg: 'Falha ao se comunicar com o gateway de pagamento.' });
    }

  } catch (err) {
    console.error(`ERRO FATAL em POST /api/pagamentos/criar-cobranca/${filiacaoId}:`, err);
    res.status(500).send('Erro interno no servidor ao processar pagamento.');
  }
};

/**
 * @desc    Recebe Webhook do PagBank (Notificação de status)
 * @route   POST /api/pagamentos/webhook/pagbank
 * @access  Público (Chamado pelo PagBank)
 */
exports.receberWebhook = async (req, res) => {
  const notificacao = req.body;
  const rawPayload = req.rawBody || '';
  console.log(`[PagamentoCtrl] Webhook PagBank recebido:`, JSON.stringify(notificacao, null, 2));

  // 1) Validação de autenticidade (PagBank)
  // Assinatura = sha256("<TOKEN>-<PAYLOAD_RAW>") e vem no header "x-authenticity-token".
  const expectedToken = process.env.PAGBANK_WEBHOOK_TOKEN;
  const authenticityHeader = req.headers['x-authenticity-token'];

  if (!expectedToken) {
    console.error('[PagamentoCtrl] PAGBANK_WEBHOOK_TOKEN não configurado. Recusando webhook por segurança.');
    return res.status(500).send('Webhook token não configurado.');
  }

  if (!rawPayload) {
    console.error('[PagamentoCtrl] rawBody ausente. Ajuste o express.json({ verify }) para capturar o payload.');
    return res.status(400).send('raw body ausente para validação.');
  }

  const computed = sha256Hex(`${expectedToken}-${rawPayload}`);
  if (!authenticityHeader || String(authenticityHeader).toLowerCase() !== computed.toLowerCase()) {
    console.warn('[PagamentoCtrl] Webhook PagBank inválido (assinatura não confere).');
    return res.status(401).send('Assinatura inválida.');
  }

  try {
    // 2) Extrair dados (Orders API)
    const idTransacaoGateway = notificacao.id; // ID do Pedido (Order)
    const novoStatusPagBank = notificacao.charges?.[0]?.status; // Status da primeira cobrança
    const referenceId = notificacao.reference_id; // Nosso ID (ex: CONFBEC_PAG_123)

    console.log(`[PagamentoCtrl] Webhook: ID Gateway=${idTransacaoGateway}, Nosso Ref=${referenceId}, Novo Status PagBank=${novoStatusPagBank}`);

    if (!idTransacaoGateway || !novoStatusPagBank || !referenceId) {
      return res.status(400).send('Notificação inválida.');
    }

    // 3) Mapear status
    let nossoNovoStatus = null;
    if (novoStatusPagBank === 'PAID') nossoNovoStatus = 'pago';
    else if (['DECLINED', 'CANCELED', 'EXPIRED'].includes(novoStatusPagBank)) nossoNovoStatus = 'falhou';
    else if (['WAITING', 'IN_ANALYSIS'].includes(novoStatusPagBank)) nossoNovoStatus = 'pendente';

    if (!nossoNovoStatus) {
      return res.status(200).send('Status sem ação.');
    }

    // 4) Atualizar nosso banco
    const pagamentoIdLocal = String(referenceId).split('_').pop();

    let pagamento = await Pagamento.findByPk(pagamentoIdLocal);
    if (!pagamento) {
      // fallback: tenta por id_transacao_gateway
      pagamento = await Pagamento.findOne({ where: { id_transacao_gateway: idTransacaoGateway } });
    }

    if (!pagamento) {
      console.warn(`[PagamentoCtrl] Webhook: Pagamento local não encontrado (ref=${referenceId}, gateway=${idTransacaoGateway}).`);
      return res.status(200).send('OK');
    }

    if (pagamento.status !== 'pendente') {
      console.log(`[PagamentoCtrl] Webhook: Pagamento local ID ${pagamento.id} já processado (Status: ${pagamento.status}).`);
      return res.status(200).send('OK');
    }

    await pagamento.update({
      status: nossoNovoStatus,
      data_pagamento: nossoNovoStatus === 'pago' ? new Date() : null
    });

    if (nossoNovoStatus === 'pago') {
      // Filiação
      if (pagamento.filiacao_id) {
        await Filiacao.update(
          { status: 'ativo' },
          { where: { id: pagamento.filiacao_id } }
        );
      }

      // Inscrição de competição
      if (pagamento.competicao_inscricao_id) {
        const inscricao = await CompeticaoInscricao.findByPk(pagamento.competicao_inscricao_id, {
          include: [{ model: CompeticaoEvento, as: 'evento', attributes: ['id', 'escopo'] }]
        });

        if (inscricao) {
          const precisa = requiresAutorizacaoEspecial(inscricao.idade_anos);
          if (precisa) {
            const authority = authorityByEscopo(inscricao.evento?.escopo);
            await CompeticaoAutorizacao.findOrCreate({
              where: { evento_id: inscricao.evento_id, atleta_id: inscricao.atleta_id, authority },
              defaults: { status: 'PENDENTE', requested_at: new Date() }
            });
            await inscricao.update({ status: 'AGUARDANDO_AUTORIZACAO' });
          } else {
            await inscricao.update({ status: 'CONFIRMADA' });
          }
        }
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error(`ERRO FATAL em POST /api/pagamentos/webhook/pagbank:`, err);
    // Em erro interno, ainda respondemos 200 para evitar retries infinitos,
    // mas logamos para análise.
    return res.status(200).send('Erro interno ao processar webhook.');
  }
};

/**
 * @desc    Recebe Webhook da Cora (Notificação de status)
 * @route   POST /api/pagamentos/webhook/cora
 * @access  Público (Chamado pela Cora)
 */
exports.receberWebhookCora = async (req, res) => {
  // Observação: o payload pode variar conforme o tipo de notificação configurada na Cora.
  // Aqui tratamos de forma tolerante e idempotente.
  const payload = req.body;

  // 1) Segurança (recomendado): Basic Auth no endpoint
  // Use CORA_WEBHOOK_BASIC_USER / CORA_WEBHOOK_BASIC_PASS (ou CORA_WEBHOOK_USER/PASS por compat)
  const user = process.env.CORA_WEBHOOK_BASIC_USER || process.env.CORA_WEBHOOK_USER;
  const pass = process.env.CORA_WEBHOOK_BASIC_PASS || process.env.CORA_WEBHOOK_PASS;

  if (user && pass) {
    const auth = req.headers.authorization || '';
    const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
    if (auth !== expected) {
      console.warn('[PagamentoCtrl] Webhook Cora inválido (Basic Auth não confere).');
      return res.status(401).send('Unauthorized');
    }
  } else {
    // Não bloqueia por padrão para não quebrar ambientes já existentes,
    // mas é altamente recomendado configurar.
    console.warn('[PagamentoCtrl] CORA_WEBHOOK_BASIC_USER/PASS não configurados. Configure Basic Auth para proteger o webhook.');
  }

  try {
    // 2) Extrair campos (melhor esforço)
    const code =
      payload?.code ||
      payload?.invoice?.code ||
      payload?.data?.code ||
      payload?.data?.invoice?.code ||
      payload?.resource?.code ||
      null;

    const invoiceId =
      payload?.invoice_id ||
      payload?.id ||
      payload?.invoice?.id ||
      payload?.data?.id ||
      payload?.data?.invoice?.id ||
      payload?.resource?.id ||
      null;

    const statusRaw =
      payload?.status ||
      payload?.invoice?.status ||
      payload?.data?.status ||
      payload?.data?.invoice?.status ||
      payload?.resource?.status ||
      payload?.payment_status ||
      null;

    const eventType = String(payload?.event || payload?.type || payload?.event_type || '').toUpperCase();
    const status = String(statusRaw || '').toUpperCase();

    // 3) Mapear status -> nosso enum
    let nossoNovoStatus = null;
    const paidStatuses = new Set(['PAID', 'RECEIVED', 'CONFIRMED', 'SETTLED', 'LIQUIDATED', 'COMPLETED', 'PAID_OUT']);
    const failedStatuses = new Set(['CANCELED', 'CANCELLED', 'EXPIRED', 'FAILED', 'REFUSED', 'VOIDED']);

    const isPaid = (status && paidStatuses.has(status)) || eventType.includes('PAID');
    const isFailed = (status && failedStatuses.has(status)) || eventType.includes('CANCEL') || eventType.includes('EXPIRED') || eventType.includes('FAILED');

    if (isPaid) nossoNovoStatus = 'pago';
    else if (isFailed) nossoNovoStatus = 'falhou';
    else if (status || eventType) nossoNovoStatus = 'pendente';
    else return res.status(200).send('OK');

    // 4) Localizar pagamento local
    let pagamento = null;

    // 4.a) Preferência: code = CONFBEC_PAG_<id>
    if (code && String(code).includes('CONFBEC_PAG_')) {
      const maybeId = String(code).split('_').pop();
      if (/^\d+$/.test(maybeId)) {
        pagamento = await Pagamento.findByPk(maybeId);
      }
    }

    // 4.b) fallback: invoiceId no campo id_transacao_gateway
    if (!pagamento && invoiceId) {
      pagamento = await Pagamento.findOne({ where: { id_transacao_gateway: String(invoiceId) } });
    }

    if (!pagamento) {
      console.warn('[PagamentoCtrl] Webhook Cora: pagamento não encontrado.', { code, invoiceId, status });
      return res.status(200).send('OK');
    }

    // Idempotência
    if (pagamento.status !== 'pendente') {
      return res.status(200).send('OK');
    }

    // 5) Atualizar também dados de PIX/Boleto caso venham no webhook e ainda não estejam salvos
    const pixText =
      payload?.pix?.emv ||
      payload?.pix?.payload ||
      payload?.pix?.qr_code ||
      payload?.invoice?.pix?.emv ||
      payload?.data?.pix?.emv ||
      null;

    const linhaDigitavel =
      payload?.bank_slip?.digitable_line ||
      payload?.boleto?.digitable_line ||
      payload?.invoice?.bank_slip?.digitable_line ||
      payload?.data?.bank_slip?.digitable_line ||
      null;

    const patch = {
      status: nossoNovoStatus,
      data_pagamento: nossoNovoStatus === 'pago' ? new Date() : null,
    };

    if (pixText && !pagamento.qr_code_pix) patch.qr_code_pix = pixText;
    if (linhaDigitavel && !pagamento.linha_digitavel_boleto) patch.linha_digitavel_boleto = linhaDigitavel;

    await pagamento.update(patch);

    if (nossoNovoStatus === 'pago') {
      // Filiação
      if (pagamento.filiacao_id) {
        await Filiacao.update(
          { status: 'ativo' },
          { where: { id: pagamento.filiacao_id } }
        );
      }

      // Inscrição de competição
      if (pagamento.competicao_inscricao_id) {
        const inscricao = await CompeticaoInscricao.findByPk(pagamento.competicao_inscricao_id, {
          include: [{ model: CompeticaoEvento, as: 'evento', attributes: ['id', 'escopo'] }]
        });

        if (inscricao) {
          const precisa = requiresAutorizacaoEspecial(inscricao.idade_anos);
          if (precisa) {
            const authority = authorityByEscopo(inscricao.evento?.escopo);
            await CompeticaoAutorizacao.findOrCreate({
              where: { evento_id: inscricao.evento_id, atleta_id: inscricao.atleta_id, authority },
              defaults: { status: 'PENDENTE', requested_at: new Date() }
            });
            await inscricao.update({ status: 'AGUARDANDO_AUTORIZACAO' });
          } else {
            await inscricao.update({ status: 'CONFIRMADA' });
          }
        }
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Erro ao processar webhook Cora:', err);
    // Em webhooks, muitas vezes é melhor responder 200 para evitar retries infinitos
    return res.status(200).send('Erro interno');
  }
};
// --- FIM DO ARQUIVO ---
