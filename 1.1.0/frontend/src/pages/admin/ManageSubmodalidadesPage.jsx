import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import {
  Box,
  Typography,
  Paper,
  Container,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  Chip,
} from '@mui/material';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import ListAltIcon from '@mui/icons-material/ListAlt';

const TIPOS = [
  { value: 'Trocação', label: 'Trocação' },
  { value: 'Grappling', label: 'Grappling' },
  { value: 'Misto' , label: 'Misto' },
  { value: 'Contato Leve' , label: 'Contato Leve' },
  { value: 'Contato Pleno', label: 'Contato Pleno' },
  { value: 'Luta Solo', label: 'Luta Solo' },

];

export default function ManageSubmodalidadesPage() {
  const [modalidadesMae, setModalidadesMae] = useState([]);
  const [modalidadeMaeId, setModalidadeMaeId] = useState('');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', nome: '', tipo: 'TROCACAO', ativo: true });

  const modalidadeMaeLabel = useMemo(() => {
    const m = modalidadesMae.find(x => String(x.id) === String(modalidadeMaeId));
    return m?.nome || '';
  }, [modalidadesMae, modalidadeMaeId]);

  const fetchModalidadesMae = async () => {
    const res = await axios.get('/api/modalidades');
    setModalidadesMae(res.data || []);
  };

  const fetchSubmodalidades = async (motherId) => {
    try {
      setLoading(true);
      setError(null);
      const qs = motherId ? `?modalidade_id=${motherId}` : '';
      const res = await axios.get(`/api/competicoes/submodalidades${qs}`);
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || 'Erro ao carregar submodalidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchModalidadesMae();
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (modalidadeMaeId) fetchSubmodalidades(modalidadeMaeId);
    else setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidadeMaeId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ code: '', nome: '', tipo: 'TROCACAO', ativo: true });
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      code: row.code || '',
      nome: row.nome || '',
      tipo: row.tipo || 'TROCACAO',
      ativo: !!row.ativo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!modalidadeMaeId) return setError('Selecione a modalidade mãe (ex: Kickboxing).');
    if (!form.code.trim() || !form.nome.trim()) return setError('Preencha code e nome.');

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(`/api/competicoes/submodalidades/${editingId}`, {
          ...form,
          modalidade_id: Number(modalidadeMaeId),
        });
        setSuccess('Submodalidade atualizada.');
      } else {
        await axios.post('/api/competicoes/submodalidades', {
          ...form,
          modalidade_id: Number(modalidadeMaeId),
        });
        setSuccess('Submodalidade cadastrada.');
      }
      resetForm();
      await fetchSubmodalidades(modalidadeMaeId);
    } catch (e2) {
      console.error(e2);
      setError(e2.response?.data?.msg || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Desativar submodalidade "${row.nome}"?`)) return;
    try {
      await axios.delete(`/api/competicoes/submodalidades/${row.id}`);
      setSuccess('Submodalidade desativada.');
      await fetchSubmodalidades(modalidadeMaeId);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.msg || 'Erro ao desativar submodalidade.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: 3 }}>
          <SportsMartialArtsIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">Submodalidades</Typography>
          <Typography variant="body1" color="text.secondary">
            Cadastre as submodalidades de competição (ex: Point Fight, Light Contact, K1...).
          </Typography>
        </Box>
      </Box>

      {(error || success) && (
        <Box sx={{ mb: 2 }}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
        </Box>
      )}

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, borderLeft: '6px solid #003366' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddCircleOutlineIcon color="secondary" />
          {editingId ? 'Editar Submodalidade' : 'Nova Submodalidade'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel id="modalidade-mae">Modalidade Mãe</InputLabel>
                <Select
                  labelId="modalidade-mae"
                  label="Modalidade Mãe"
                  value={modalidadeMaeId}
                  onChange={(e) => setModalidadeMaeId(e.target.value)}
                  disabled={saving}
                >
                  {modalidadesMae.map(m => (
                    <MenuItem key={m.id} value={String(m.id)}>{m.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Code"
                fullWidth
                value={form.code}
                onChange={(e) => setForm(s => ({ ...s, code: e.target.value }))}
                disabled={saving}
                placeholder="Ex: POINT_FIGHT"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Nome"
                fullWidth
                value={form.nome}
                onChange={(e) => setForm(s => ({ ...s, nome: e.target.value }))}
                disabled={saving}
                placeholder="Ex: Point Fight"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="tipo">Tipo</InputLabel>
                <Select
                  labelId="tipo"
                  label="Tipo"
                  value={form.tipo}
                  onChange={(e) => setForm(s => ({ ...s, tipo: e.target.value }))}
                  disabled={saving}
                >
                  {TIPOS.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={form.ativo} onChange={(e) => setForm(s => ({ ...s, ativo: e.target.checked }))} />}
                label={form.ativo ? 'Ativo' : 'Inativo'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
              >
                {saving ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}
              </Button>
              {editingId && (
                <Button onClick={resetForm} fullWidth sx={{ mt: 1 }} disabled={saving}>
                  Cancelar edição
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">
            Submodalidades {modalidadeMaeLabel ? `— ${modalidadeMaeLabel}` : ''}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '90px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '180px' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '140px' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', width: '150px' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Carregando...</Typography>
                  </TableCell>
                </TableRow>
              ) : !modalidadeMaeId ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="text.secondary">Selecione a modalidade mãe para listar as submodalidades.</Typography>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="text.secondary">Nenhuma submodalidade encontrada.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell><Chip label={`#${row.id}`} size="small" variant="outlined" /></TableCell>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{row.code}</Typography></TableCell>
                    <TableCell><Typography variant="body1" fontWeight={500}>{row.nome}</Typography></TableCell>
                    <TableCell>{row.tipo}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.ativo ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={row.ativo ? 'success' : 'default'}
                        variant={row.ativo ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar" arrow>
                        <IconButton onClick={() => handleEdit(row)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Desativar" arrow>
                        <IconButton color="error" onClick={() => handleDelete(row)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
