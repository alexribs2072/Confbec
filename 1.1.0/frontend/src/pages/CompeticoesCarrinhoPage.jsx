import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CompeticoesCarrinhoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [itens, setItens] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [metodos, setMetodos] = useState([]);
  const [metodoId, setMetodoId] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const totalSelecionado = useMemo(() => {
    let t = 0;
    for (const it of itens) {
      if (selecionados.has(it.id)) t += Number(it.taxa_inscricao || 0);
    }
    return t;
  }, [itens, selecionados]);

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const [cartRes, metRes] = await Promise.all([
        axios.get('/api/competicoes/carrinho'),
        axios.get('/api/metodos-pagamento'),
      ]);
      const cartItens = cartRes.data?.itens || [];
      setItens(cartItens);
      setSelecionados(new Set(cartItens.map(i => i.id)));

      const ativos = (metRes.data || []).filter(m => m.ativo !== false);
      setMetodos(ativos);
      if (!metodoId && ativos.length) setMetodoId(String(ativos[0].id));
    } catch (e) {
      console.error(e);
      setErro(e?.response?.data?.msg || 'Erro ao carregar carrinho.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const remover = async (id) => {
    try {
      await axios.delete(`/api/competicoes/inscricoes/${id}`);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro(e?.response?.data?.msg || 'Erro ao remover inscrição.');
    }
  };

  const checkout = async () => {
    setErro('');
    const ids = Array.from(selecionados);
    if (!ids.length) {
      setErro('Selecione pelo menos uma inscrição.');
      return;
    }
    if (!metodoId) {
      setErro('Selecione um método de pagamento.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await axios.post('/api/competicoes/checkout', {
        inscricao_ids: ids,
        metodo_pagamento_id: Number(metodoId),
      });
      const pagamentoId = res.data?.pagamentoId;
      if (pagamentoId) navigate(`/pagamento/${pagamentoId}`);
      else setErro('Checkout concluído, mas não retornou pagamentoId.');
    } catch (e) {
      console.error(e);
      setErro(e?.response?.data?.msg || 'Erro ao criar cobrança.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h4">Carrinho de inscrições</Typography>
        <Typography color="text.secondary">
          Selecione as inscrições que deseja pagar agora. O valor será somado e cobrado em uma única transação.
        </Typography>

        {erro && <Alert severity="error">{erro}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <Card sx={{ flex: 1, width: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Itens</Typography>
                <Divider sx={{ mb: 2 }} />

                {!itens.length ? (
                  <Typography color="text.secondary">Seu carrinho está vazio.</Typography>
                ) : (
                  <List disablePadding>
                    {itens.map((it) => (
                      <ListItem key={it.id} disableGutters sx={{ py: 1 }}
                        secondaryAction={
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => remover(it.id)} disabled={checkoutLoading}>Remover</Button>
                          </Stack>
                        }
                      >
                        <FormControlLabel
                          control={<Checkbox checked={selecionados.has(it.id)} onChange={() => toggle(it.id)} />}
                          label={
                            <ListItemText
                              primary={`${it.evento?.nome || 'Evento'} — ${it.competicaoModalidade?.nome || 'Modalidade'}`}
                              secondary={`Taxa: R$ ${Number(it.taxa_inscricao || 0).toFixed(2)} • Status: ${it.status}`}
                            />
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            <Card sx={{ width: { xs: '100%', md: 380 } }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pagamento</Typography>
                <Divider sx={{ mb: 2 }} />

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="metodo-pagamento">Método</InputLabel>
                  <Select
                    labelId="metodo-pagamento"
                    label="Método"
                    value={metodoId}
                    onChange={(e) => setMetodoId(e.target.value)}
                  >
                    {metodos.map((m) => (
                      <MenuItem key={m.id} value={String(m.id)}>{m.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="body2" color="text.secondary">Total selecionado</Typography>
                <Typography variant="h4" sx={{ mb: 2 }}>R$ {Number(totalSelecionado || 0).toFixed(2)}</Typography>

                <Button
                  variant="contained"
                  fullWidth
                  disabled={checkoutLoading || !itens.length || !selecionados.size}
                  onClick={checkout}
                >
                  {checkoutLoading ? 'Gerando cobrança…' : 'Pagar agora'}
                </Button>

                <Button
                  variant="text"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/competicoes')}
                  disabled={checkoutLoading}
                >
                  Voltar para competições
                </Button>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
