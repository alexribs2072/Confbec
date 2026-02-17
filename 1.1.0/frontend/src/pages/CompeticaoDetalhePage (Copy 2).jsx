import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
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

export default function CompeticaoDetalhePage() {
  const { eventoId } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [elig, setElig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]); // ids
  const [peso, setPeso] = useState('');
  const [categoria, setCategoria] = useState('COLORIDAS');
  const [saving, setSaving] = useState(false);

  const eligibleList = useMemo(() => {
    return (elig?.modalidades || []).filter(m => m.elegivel);
  }, [elig]);

  const total = useMemo(() => {
    const map = new Map((eligibleList || []).map(m => [String(m.competicao_modalidade_id), m]));
    return selected.reduce((acc, id) => acc + Number(map.get(String(id))?.taxa_inscricao || 0), 0);
  }, [selected, eligibleList]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eRes, elRes] = await Promise.all([
        axios.get(`/api/competicoes/eventos/${eventoId}`),
        axios.get(`/api/competicoes/eventos/${eventoId}/elegibilidade`),
      ]);

      setEvento(eRes.data);
      setElig(elRes.data);
    } catch (err) {
      console.error('[CompeticaoDetalhePage] erro:', err);
      setError(err.response?.data?.msg || 'Erro ao carregar o evento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const abrirInscricao = () => {
    setSelected([]);
    setOpen(true);
  };

  const toggle = (id) => {
    setSelected((prev) => {
      const s = String(id);
      if (prev.map(String).includes(s)) return prev.filter(x => String(x) !== s);
      return [...prev, id];
    });
  };

  const inscrever = async () => {
    try {
      setSaving(true);
      setError(null);

      if (selected.length === 0) {
        setError('Selecione ao menos 1 submodalidade.');
        return;
      }

      const payload = {
        competicao_modalidade_ids: selected,
        peso_kg: peso ? Number(peso) : undefined,
        categoria_combate: categoria,
      };

      const res = await axios.post(`/api/competicoes/eventos/${eventoId}/inscricoes`, payload);
      const pagamentoId = res.data?.pagamento_id || res.data?.pagamentoId || null;
      setOpen(false);

      // Leva o atleta para "Minhas inscrições" (mostra pagamentos/itens)
      navigate('/competicoes/minhas-inscricoes');

    } catch (err) {
      console.error('[CompeticaoDetalhePage] erro inscrição:', err);
      setError(err.response?.data?.msg || 'Erro ao criar inscrição.');
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

  if (!evento) {
    return <Alert severity="error">Evento não encontrado.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>{evento.nome}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip size="small" label={evento.status} variant="outlined" />
            {evento.modalidadeMae?.nome && <Chip size="small" label={`Modalidade: ${evento.modalidadeMae.nome}`} variant="outlined" />}
          </Box>

          {evento.descricao && (
            <Typography variant="body1" sx={{ mb: 1 }}>{evento.descricao}</Typography>
          )}

          <Typography variant="body2" color="text.secondary">
            Data: <strong>{fmtDate(evento.data_evento)}</strong>
            {evento.data_fim ? <> • Fim: <strong>{fmtDate(evento.data_fim)}</strong></> : null}
          </Typography>
          {evento.local && (
            <Typography variant="body2" color="text.secondary">
              Local: <strong>{evento.local}</strong>
            </Typography>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Submodalidades disponíveis</Typography>

          {(elig?.modalidades || []).length === 0 ? (
            <Alert severity="info">Nenhuma submodalidade configurada para este evento.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(elig?.modalidades || []).map((m) => (
                <Box key={m.competicao_modalidade_id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box>
                    <Typography fontWeight={700}>{m.nome}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taxa: <strong>{money(m.taxa_inscricao)}</strong>
                      {m.motivo ? <> • <em>{m.motivo}</em></> : null}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={m.elegivel ? 'Elegível' : 'Inelegível'}
                    color={m.elegivel ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Button
            variant="contained"
            onClick={abrirInscricao}
            disabled={evento.status !== 'INSCRICOES_ABERTAS' || eligibleList.length === 0}
            fullWidth
          >
            Inscrever (selecionar submodalidades)
          </Button>

          {evento.status !== 'INSCRICOES_ABERTAS' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Inscrições não estão abertas para este evento.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => (!saving ? setOpen(false) : null)} fullWidth maxWidth="sm">
        <DialogTitle>Inscrição</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Selecione uma ou mais submodalidades. O sistema irá gerar uma cobrança com itens e cobrar o total.
          </Typography>

          <FormGroup sx={{ mb: 2 }}>
            {eligibleList.map((m) => (
              <FormControlLabel
                key={m.competicao_modalidade_id}
                control={<Checkbox checked={selected.map(String).includes(String(m.competicao_modalidade_id))} onChange={() => toggle(m.competicao_modalidade_id)} />}
                label={`${m.nome} — ${money(m.taxa_inscricao)}`}
              />
            ))}
          </FormGroup>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Peso (kg)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              type="number"
              inputProps={{ step: '0.1' }}
              fullWidth
            />
            <TextField
              label="Categoria (Point Fight)"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              select
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="COLORIDAS">Coloridas</option>
              <option value="AVANCADA">Avançada</option>
            </TextField>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={800}>Total: {money(total)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={inscrever} disabled={saving || selected.length === 0}>
            {saving ? 'Criando...' : 'Confirmar e gerar invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
