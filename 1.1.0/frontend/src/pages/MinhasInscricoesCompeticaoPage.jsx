import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR');
  } catch {
    return String(d);
  }
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MinhasInscricoesCompeticaoPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/competicoes/invoices/me');
      setData(res.data || []);
    } catch (err) {
      console.error('[MinhasInscricoesCompeticaoPage] erro:', err);
      setError(err.response?.data?.msg || 'Erro ao carregar inscrições/faturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const pagarInvoice = async (invoiceId) => {
    try {
      setPayingId(invoiceId);
      const res = await axios.post(`/api/competicoes/invoices/${invoiceId}/criar-cobranca`, {});
      const pagamentoId = res.data?.pagamentoId;
      if (!pagamentoId) throw new Error('Pagamento não retornado pelo servidor.');
      navigate(`/pagamento/${pagamentoId}`);
    } catch (err) {
      console.error('[MinhasInscricoesCompeticaoPage] erro pagar:', err);
      setError(err.response?.data?.msg || 'Erro ao gerar cobrança.');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress />
        <Typography>Carregando suas inscrições...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>Minhas Inscrições</Typography>
        <Button component={RouterLink} to="/competicoes" variant="outlined">Ver competições</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data.length === 0 ? (
        <Alert severity="info">Você ainda não possui inscrições em competições.</Alert>
      ) : (
        <Grid container spacing={2}>
          {data.map((inv) => (
            <Grid item xs={12} md={6} key={inv.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    {inv.evento?.nome || 'Evento'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" label={`Invoice #${inv.id}`} variant="outlined" />
                    <Chip size="small" label={inv.status} color={inv.status === 'PAGO' ? 'success' : (inv.status === 'PENDENTE' ? 'warning' : 'default')} variant="outlined" />
                    <Chip size="small" label={`Total: ${money(inv.valor_total)}`} variant="outlined" />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Data do evento: <strong>{fmtDate(inv.evento?.data_evento)}</strong>
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Itens</Typography>
                  {(inv.itens || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  ) : (
                    <List dense disablePadding>
                      {(inv.itens || []).map((it) => (
                        <ListItem key={it.id} disableGutters divider>
                          <ListItemText
                            primary={it.descricao}
                            secondary={money(it.valor)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  {inv.status === 'PENDENTE' ? (
                    <Button
                      variant="contained"
                      onClick={() => pagarInvoice(inv.id)}
                      disabled={payingId === inv.id}
                      fullWidth
                    >
                      {payingId === inv.id ? 'Gerando cobrança...' : 'Pagar invoice'}
                    </Button>
                  ) : (
                    <Button variant="outlined" onClick={fetchInvoices} fullWidth>
                      Atualizar
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
