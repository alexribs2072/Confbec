import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';

import { useAuth } from '../context/AuthContext';

function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR');
  } catch {
    return String(d);
  }
}

export default function CompeticaoDetalhePage() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAtleta = user?.tipo === 'atleta';

  const [evento, setEvento] = useState(null);
  const [elig, setElig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModalidade, setSelectedModalidade] = useState(null);
  const [pesoKg, setPesoKg] = useState('');
  const [categoria, setCategoria] = useState('COLORIDAS');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const modalidades = useMemo(() => {
    return (elig?.modalidades || evento?.modalidades || []).slice();
  }, [elig, evento]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const resEvento = await axios.get(`/api/competicoes/eventos/${eventoId}`);
        setEvento(resEvento.data);

        if (isAtleta) {
          const resElig = await axios.get(`/api/competicoes/eventos/${eventoId}/elegibilidade`);
          setElig(resElig.data);
        } else {
          setElig(null);
        }
      } catch (err) {
        console.error('[CompeticaoDetalhePage] erro:', err);
        setError(err.response?.data?.msg || 'Erro ao carregar detalhes do evento.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [eventoId, isAtleta]);

  const openDialog = (m) => {
    setSelectedModalidade(m);
    setPesoKg('');
    setCategoria('COLORIDAS');
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleInscrever = async () => {
    if (!selectedModalidade) return;
    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        competicao_modalidade_id: selectedModalidade.competicao_modalidade_id || selectedModalidade.id,
        peso_kg: Number(pesoKg),
        categoria_combate: categoria,
      };

      const res = await axios.post(`/api/competicoes/eventos/${eventoId}/inscricoes`, payload);
      setDialogOpen(false);
      // Vai para minhas inscrições
      navigate('/competicoes/minhas-inscricoes', { replace: true });
      return res.data;
    } catch (err) {
      console.error('[CompeticaoDetalhePage] erro inscrição:', err);
      setSaveError(err.response?.data?.msg || 'Erro ao criar inscrição.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
        <CircularProgress />
        <Typography>Carregando evento...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!evento) {
    return <Alert severity="warning">Evento não encontrado.</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>{evento.nome}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip label={evento.escopo} variant="outlined" />
            <Chip label={evento.status} color={evento.status === 'INSCRICOES_ABERTAS' ? 'success' : 'default'} variant="outlined" />
            <Chip label={`Data: ${fmtDate(evento.data_evento)}`} variant="outlined" />
          </Box>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/competicoes')}>Voltar</Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        {evento.local && (
          <Typography variant="body1"><strong>Local:</strong> {evento.local}</Typography>
        )}
        {evento.descricao && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {evento.descricao}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          Modalidades do evento
        </Typography>

        {modalidades.length === 0 ? (
          <Alert severity="info">Nenhuma modalidade vinculada a este evento.</Alert>
        ) : (
          <List dense>
            {modalidades.map((m) => {
              const eligible = m.elegivel ?? true;
              const motivo = m.motivo || null;
              const id = m.competicao_modalidade_id || m.id;
              return (
                <ListItem key={id} divider>
                  <ListItemText
                    primary={m.nome}
                    secondary={
                      motivo
                        ? motivo
                        : (m.tipo ? `Tipo: ${m.tipo}` : null)
                    }
                  />
                  <ListItemSecondaryAction>
                    {isAtleta ? (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!eligible || evento.status !== 'INSCRICOES_ABERTAS'}
                        onClick={() => openDialog(m)}
                      >
                        Inscrever
                      </Button>
                    ) : (
                      <Chip size="small" label={eligible ? 'Disponível' : 'Indisponível'} variant="outlined" />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}

        {!user && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Faça login como atleta para verificar elegibilidade e se inscrever.
          </Alert>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Inscrição</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {selectedModalidade?.nome}
          </Typography>

          <TextField
            label="Peso (kg)"
            type="number"
            value={pesoKg}
            onChange={(e) => setPesoKg(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            inputProps={{ step: '0.1', min: '0' }}
          />

          <TextField
            select
            label="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          >
            <MenuItem value="COLORIDAS">Coloridas</MenuItem>
            <MenuItem value="AVANCADA">Avançada</MenuItem>
          </TextField>

          {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
          <Alert severity="warning" sx={{ mt: 2 }}>
            As divisões (peso/idade) são calculadas automaticamente e serão ajustadas quando o Regulamento Geral for carregado.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleInscrever}
            disabled={saving || !pesoKg || Number(pesoKg) <= 0}
          >
            {saving ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
