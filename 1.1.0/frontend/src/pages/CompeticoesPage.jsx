import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid'; 



function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR');
  } catch {
    return String(d);
  }
}

export default function CompeticoesPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get('/api/competicoes/eventos');
        setEventos(res.data || []);
      } catch (err) {
        console.error('[CompeticoesPage] erro:', err);
        setError(err.response?.data?.msg || 'Erro ao carregar competições.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress />
        <Typography>Carregando competições...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>Competições</Typography>
        <Button component={RouterLink} to="/competicoes/minhas-inscricoes" variant="outlined">
          Minhas Inscrições
        </Button>
      </Box>

      {eventos.length === 0 ? (
        <Alert severity="info">Nenhuma competição disponível no momento.</Alert>
      ) : (
        <Grid container spacing={2}>
          {eventos.map((e) => (
            <Grid key={e.id} xs={12} md={6} lg={4}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {e.nome}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" label={e.escopo} variant="outlined" />
                    <Chip
                      size="small"
                      label={e.status}
                      color={e.status === 'INSCRICOES_ABERTAS' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Data: <strong>{fmtDate(e.data_evento)}</strong>
                  </Typography>

                  {e.local && (
                    <Typography variant="body2" color="text.secondary">
                      Local: {e.local}
                    </Typography>
                  )}

                  {Array.isArray(e.modalidades) && e.modalidades.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Modalidades: {e.modalidades.map(m => m.nome).slice(0, 3).join(', ')}{e.modalidades.length > 3 ? '…' : ''}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button component={RouterLink} to={`/competicoes/${e.id}`} variant="contained" fullWidth>
                    Ver detalhes
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
