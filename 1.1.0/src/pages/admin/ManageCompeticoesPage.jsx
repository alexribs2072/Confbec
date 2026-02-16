import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';

import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';

const ESCOPOS = [
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'ESTADUAL', label: 'Estadual' },
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'INTERNACIONAL', label: 'Internacional' },
];

const STATUS = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'INSCRICOES_ABERTAS', label: 'Inscrições abertas' },
  { value: 'INSCRICOES_ENCERRADAS', label: 'Inscrições encerradas' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

function toDateInput(v) {
  if (!v) return '';
  // aceita ISO e "YYYY-MM-DD"
  return String(v).slice(0, 10);
}

export default function ManageCompeticoesPage() {
  const [eventos, setEventos] = useState([]);
  const [modalidadesMae, setModalidadesMae] = useState([]);
  const [submodalidades, setSubmodalidades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    modalidade_id: '',
    nome: '',
    descricao: '',
    local: '',
    escopo: 'MUNICIPAL',
    status: 'RASCUNHO',
    data_evento: '',
    data_fim: '',
    taxa_inscricao: 0,
  });
  // { [subId]: { selected: boolean, taxa: number } }
  const [modsState, setModsState] = useState({});

  const modalidadeMaeLabel = useMemo(() => {
    const m = modalidadesMae.find(x => String(x.id) === String(form.modalidade_id));
    return m?.nome || '';
  }, [modalidadesMae, form.modalidade_id]);

  const fetchModalidadesMae = async () => {
    const res = await axios.get('/api/modalidades');
    setModalidadesMae(res.data || []);
  };

  const fetchEventos = async () => {
    const res = await axios.get('/api/competicoes/eventos');
    setEventos(res.data || []);
  };

  const fetchSubmodalidades = async (modalidadeMaeId) => {
    if (!modalidadeMaeId) {
      setSubmodalidades([]);
      return;
    }
    const res = await axios.get(`/api/competicoes/submodalidades?modalidade_id=${modalidadeMaeId}&ativo=true`);
    setSubmodalidades(res.data || []);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({
      modalidade_id: '',
      nome: '',
      descricao: '',
      local: '',
      escopo: 'MUNICIPAL',
      status: 'RASCUNHO',
      data_evento: '',
      data_fim: '',
      taxa_inscricao: 0,
    });
    setModsState({});
    setOpen(true);
  };

  const openEdit = async (row) => {
    setEditId(row.id);
    setForm({
      modalidade_id: row.modalidade_id ? String(row.modalidade_id) : '',
      nome: row.nome || '',
      descricao: row.descricao || '',
      local: row.local || '',
      escopo: row.escopo || 'MUNICIPAL',
      status: row.status || 'RASCUNHO',
      data_evento: toDateInput(row.data_evento),
      data_fim: toDateInput(row.data_fim),
      taxa_inscricao: Number(row.taxa_inscricao ?? 0),
    });

    const motherId = row.modalidade_id ? String(row.modalidade_id) : '';
    await fetchSubmodalidades(motherId);

    const next = {};
    for (const sm of (row.modalidades || [])) {
      next[sm.id] = {
        selected: true,
        taxa: Number(sm?.CompeticaoEventoModalidade?.taxa_inscricao ?? 0),
      };
    }
    setModsState(next);
    setOpen(true);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchModalidadesMae();
        await fetchEventos();
      } catch (e) {
        console.error(e);
        setError(e.response?.data?.msg || 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // quando muda modalidade mãe no form, recarrega submodalidades
    (async () => {
      try {
        await fetchSubmodalidades(form.modalidade_id);
        // remove seleções de submodalidades que não pertencem à modalidade mãe nova
        setModsState(prev => {
          const allowedIds = new Set((submodalidades || []).map(s => String(s.id)));
          const next = {};
          for (const [k, v] of Object.entries(prev || {})) {
            if (allowedIds.has(String(k))) next[k] = v;
          }
          return next;
        });
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.modalidade_id]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!form.nome.trim() || !form.data_evento) {
      return setError('Campos obrigatórios: Nome e Data do evento.');
    }
    if (!form.modalidade_id) {
      return setError('Selecione a modalidade mãe do evento.');
    }

    const selectedIds = Object.entries(modsState)
      .filter(([, v]) => v?.selected)
      .map(([k]) => Number(k));

    try {
      setSaving(true);
      let eventoId = editId;
      if (!editId) {
        const created = await axios.post('/api/competicoes/eventos', {
          ...form,
          modalidade_id: Number(form.modalidade_id),
          taxa_inscricao: Number(form.taxa_inscricao ?? 0),
        });
        eventoId = created.data?.id;
      } else {
        await axios.put(`/api/competicoes/eventos/${editId}`, {
          ...form,
          modalidade_id: Number(form.modalidade_id),
          taxa_inscricao: Number(form.taxa_inscricao ?? 0),
        });
      }

      // Vincula submodalidades + taxa por submodalidade
      const modalidadesPayload = selectedIds.map(id => ({
        id,
        taxa_inscricao: Number(modsState[id]?.taxa ?? 0),
      }));
      await axios.put(`/api/competicoes/eventos/${eventoId}/modalidades`, { modalidades: modalidadesPayload });

      await fetchEventos();
      setOpen(false);
      setSuccess('Competição salva com sucesso.');
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || 'Erro ao salvar competição.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Cancelar competição "${row.nome}"?`)) return;
    try {
      await axios.delete(`/api/competicoes/eventos/${row.id}`);
      await fetchEventos();
      setSuccess('Competição cancelada.');
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || 'Erro ao cancelar competição.');
    }
  };

  const toggleMod = (id, checked) => {
    setModsState(prev => ({
      ...(prev || {}),
      [id]: { selected: checked, taxa: Number(prev?.[id]?.taxa ?? 0) },
    }));
  };

  const setTaxa = (id, value) => {
    setModsState(prev => ({
      ...(prev || {}),
      [id]: { selected: !!prev?.[id]?.selected, taxa: Number(value || 0) },
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: 3 }}>
          <SportsMartialArtsIcon fontSize="large" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">Competições</Typography>
          <Typography variant="body1" color="text.secondary">CRUD de competições e vínculo de submodalidades com taxa.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={openCreate}>
          Nova competição
        </Button>
      </Box>

      {(error || success) && (
        <Box sx={{ mb: 2 }}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
        </Box>
      )}

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">Competições cadastradas</Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: 90 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 190 }}>Modalidade</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 130 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', width: 150 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : eventos.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><Typography color="text.secondary">Nenhuma competição.</Typography></TableCell></TableRow>
              ) : (
                eventos.map(ev => (
                  <TableRow key={ev.id} hover>
                    <TableCell><Chip label={`#${ev.id}`} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{ev.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">{ev.local || '—'}</Typography>
                    </TableCell>
                    <TableCell>{ev?.modalidadeMae?.nome || '—'}</TableCell>
                    <TableCell>{toDateInput(ev.data_evento) || '—'}</TableCell>
                    <TableCell>{ev.status}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar" arrow>
                        <IconButton onClick={() => openEdit(ev)}><EditIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar" arrow>
                        <IconButton color="error" onClick={() => handleDelete(ev)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Editar Competição' : 'Nova Competição'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="modMae">Modalidade Mãe</InputLabel>
                <Select
                  labelId="modMae"
                  label="Modalidade Mãe"
                  value={form.modalidade_id}
                  onChange={(e) => setForm(s => ({ ...s, modalidade_id: e.target.value }))}
                  disabled={saving}
                >
                  {modalidadesMae.map(m => (
                    <MenuItem key={m.id} value={String(m.id)}>{m.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome"
                fullWidth
                value={form.nome}
                onChange={(e) => setForm(s => ({ ...s, nome: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                label="Descrição"
                fullWidth
                multiline
                minRows={2}
                value={form.descricao}
                onChange={(e) => setForm(s => ({ ...s, descricao: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Local"
                fullWidth
                value={form.local}
                onChange={(e) => setForm(s => ({ ...s, local: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="escopo">Escopo</InputLabel>
                <Select
                  labelId="escopo"
                  label="Escopo"
                  value={form.escopo}
                  onChange={(e) => setForm(s => ({ ...s, escopo: e.target.value }))}
                  disabled={saving}
                >
                  {ESCOPOS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status">Status</InputLabel>
                <Select
                  labelId="status"
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm(s => ({ ...s, status: e.target.value }))}
                  disabled={saving}
                >
                  {STATUS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Data do evento"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.data_evento}
                onChange={(e) => setForm(s => ({ ...s, data_evento: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Data fim"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.data_fim}
                onChange={(e) => setForm(s => ({ ...s, data_fim: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Taxa base (fallback)"
                type="number"
                fullWidth
                value={form.taxa_inscricao}
                onChange={(e) => setForm(s => ({ ...s, taxa_inscricao: e.target.value }))}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Submodalidades {modalidadeMaeLabel ? `— ${modalidadeMaeLabel}` : ''}
                </Typography>
                {!form.modalidade_id ? (
                  <Alert severity="info">Selecione a modalidade mãe para carregar as submodalidades.</Alert>
                ) : submodalidades.length === 0 ? (
                  <Alert severity="warning">Nenhuma submodalidade cadastrada para esta modalidade mãe. Cadastre em: Admin → Submodalidades.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 70 }}>Usar</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 160 }}>Taxa (R$)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submodalidades.map(sm => {
                        const state = modsState[sm.id] || { selected: false, taxa: 0 };
                        return (
                          <TableRow key={sm.id} hover>
                            <TableCell>
                              <Checkbox
                                checked={!!state.selected}
                                onChange={(e) => toggleMod(sm.id, e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={600}>{sm.nome}</Typography>
                              <Typography variant="caption" color="text.secondary">{sm.code}</Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={state.taxa}
                                disabled={!state.selected}
                                onChange={(e) => setTaxa(sm.id, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
