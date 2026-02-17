import React, { useEffect, useMemo, useState } from 'react';
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

  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInscricoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/competicoes/inscricoes/me');
      setInscricoes(res.data || []);
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

  // Agrupa por pagamento (quando houver) — caso não tenha pagamento, agrupa por evento
  const grupos = useMemo(() => {
    const map = new Map();

    (inscricoes || []).forEach((i) => {
      const item = (i.pagamentoItens || [])[0];
      const pagamento = item?.pagamento || null;
      const key = pagamento ? `p:${pagamento.id}` : `e:${i.evento_id}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          pagamento,
          evento: i.evento || null,
          itens: [],
          inscricoes: [],
        });
      }

      const g = map.get(key);
      g.inscricoes.push(i);
      if (pagamento) {
        // usa itens do pagamento se existirem, senão monta a partir da inscrição
        const itens = pagamento.itens && pagamento.itens.length ? pagamento.itens : null;
        if (itens) {
          g.itens = itens;
        } else {
          g.itens.push({
            id: `${i.id}`,
            descricao: `${i.evento?.nome || 'Evento'} - ${i.competicaoModalidade?.nome || 'Submodalidade'}`,
            valor: item?.valor ?? 0,
          });
        }
      } else {
        g.itens.push({
          id: `${i.id}`,
          descricao: `${i.evento?.nome || 'Evento'} - ${i.competicaoModalidade?.nome || 'Submodalidade'}`,
          valor: 0,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const da = new Date(a.evento?.data_evento || 0).getTime();
      const db = new Date(b.evento?.data_evento || 0).getTime();
      return db - da;
    });
  }, [inscricoes]);

  const totalGrupo = (g) => {
    if (g.pagamento?.valor_total != null) return Number(g.pagamento.valor_total || 0);
    return (g.itens || []).reduce((acc, it) => acc + Number(it.valor || 0), 0);
  };

  const statusLabel = (g) => {
    if (g.pagamento) return g.pagamento.status;
    // fallback: se todas confirmadas
    const sts = new Set((g.inscricoes || []).map((i) => i.status));
    if (sts.size === 1) return Array.from(sts)[0];
    return 'MISTO';
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

      {grupos.length === 0 ? (
        <Alert severity="info">Você ainda não possui inscrições em competições.</Alert>
      ) : (
        <Grid container spacing={2}>
          {grupos.map((g) => (
            <Grid item xs={12} md={6} key={g.key}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    {g.evento?.nome || 'Evento'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {g.pagamento?.id ? (
                      <Chip size="small" label={`Pagamento #${g.pagamento.id}`} variant="outlined" />
                    ) : (
                      <Chip size="small" label="Sem cobrança" variant="outlined" />
                    )}
                    <Chip size="small" label={statusLabel(g)} variant="outlined" />
                    <Chip size="small" label={`Total: ${money(totalGrupo(g))}`} variant="outlined" />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Data do evento: <strong>{fmtDate(g.evento?.data_evento)}</strong>
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Itens</Typography>
                  {(g.itens || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  ) : (
                    <List dense disablePadding>
                      {(g.itens || []).map((it) => (
                        <ListItem key={it.id} disableGutters divider>
                          <ListItemText primary={it.descricao} secondary={money(it.valor)} />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Inscrições</Typography>
                  <List dense disablePadding>
                    {(g.inscricoes || []).map((i) => (
                      <ListItem key={i.id} disableGutters divider>
                        <ListItemText
                          primary={i.competicaoModalidade?.nome || 'Submodalidade'}
                          secondary={`Status: ${i.status} • Peso: ${i.peso_kg}kg • ${i.divisao_peso_label || i.divisao_peso}`}
                        />
                        <Button size="small" onClick={() => navigate(`/competicoes/inscricoes/${i.id}`)}>
                          Ver
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  {g.pagamento?.id ? (
                    <Button variant="outlined" fullWidth onClick={() => navigate(`/pagamento/${g.pagamento.id}`)}>
                      Ver pagamento
                    </Button>
                  ) : (
                    <Button variant="outlined" fullWidth onClick={fetchInscricoes}>
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
