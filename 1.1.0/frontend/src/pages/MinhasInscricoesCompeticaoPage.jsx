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

export default function MinhasInscricoesCompeticaoPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchInscricoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/competicoes/inscricoes/me');
      setData(res.data || []);
    } catch (err) {
      console.error('[MinhasInscricoesCompeticaoPage] erro:', err);
      setError(err.response?.data?.msg || 'Erro ao carregar inscrições.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscricoes();
  }, []);

  const pagar = async (inscricaoId) => {
    try {
      setPayingId(inscricaoId);
      const res = await axios.post(`/api/competicoes/inscricoes/${inscricaoId}/criar-cobranca`, {});
      const pagamentoId = res.data?.pagamentoId;
      if (!pagamentoId) throw new Error('Pagamento não retornado pelo servidor.');
      navigate(`/pagamento/${pagamentoId}`);
    } catch (err) {
      console.error('[MinhasInscricoesCompeticaoPage] erro pagar:', err);
      setError(err.response?.data?.msg || 'Erro ao criar cobrança.');
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
          {data.map((i) => (
            <Grid item xs={12} md={6} key={i.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    {i.evento?.nome || 'Evento'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" label={i.status} color={i.status === 'CONFIRMADA' ? 'success' : 'default'} variant="outlined" />
                    <Chip size="small" label={i.competicaoModalidade?.nome || 'Modalidade'} variant="outlined" />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Data do evento: <strong>{fmtDate(i.evento?.data_evento)}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Peso informado: <strong>{Number(i.peso_kg).toFixed(1)} kg</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grupo etário: <strong>{i.grupo_etario}</strong> • Divisão peso: <strong>{i.divisao_peso}</strong>
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  {i.status === 'PENDENTE_PAGAMENTO' ? (
                    <Button
                      variant="contained"
                      onClick={() => pagar(i.id)}
                      disabled={payingId === i.id}
                      fullWidth
                    >
                      {payingId === i.id ? 'Gerando cobrança...' : 'Pagar inscrição'}
                    </Button>
                  ) : (
                    <Button variant="outlined" onClick={fetchInscricoes} fullWidth>
                      Atualizar status
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
