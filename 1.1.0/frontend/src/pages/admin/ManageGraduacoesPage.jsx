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
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Stack
} from '@mui/material';

// Ícones
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const ESCOPOS = [
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'ESTADUAL', label: 'Estadual' },
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'INTERNACIONAL', label: 'Internacional' },
];

const STATUS = [
  { value: 'RASCUNHO', label: 'Rascunho', color: 'default' },
  { value: 'INSCRICOES_ABERTAS', label: 'Inscrições Abertas', color: 'success' },
  { value: 'INSCRICOES_ENCERRADAS', label: 'Inscrições Encerradas', color: 'warning' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'info' },
  { value: 'FINALIZADO', label: 'Finalizado', color: 'primary' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'error' },
];

function toDateInput(v) {
  if (!v) return '';
  return String(v).slice(0, 10);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function ManageCompeticoesPage() {
  const [eventos, setEventos] = useState([]);
  const [modalidadesMae, setModalidadesMae] = useState([]);
  const [submodalidades, setSubmodalidades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
  
  const [modsState, setModsState] = useState({});

  const modalidadeMaeLabel = useMemo(() => {
    const m = modalidadesMae.find(x => String(x.id) === String(form.modalidade_id));
    return m?.nome || '';
  }, [modalidadesMae, form.modalidade_id]);

  // --- Buscas ---
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
    (async () => {
      try {
        await fetchSubmodalidades(form.modalidade_id);
        setModsState(prev => {
          const allowedIds = new Set((submodalidades || []).map(s => String(s.id)));
          const next = {};
          for (const [k, v] of Object.entries(prev || {})) {
            if (allowedIds.has(String(k))) next[k] = v;
          }
          return next;
        });
      } catch (e) { console.error(e); }
    })();
  }, [form.modalidade_id]);

  // --- Handlers ---
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
      const payload = {
          ...form,
          modalidade_id: Number(form.modalidade_id),
          taxa_inscricao: Number(form.taxa_inscricao ?? 0),
      };

      if (!editId) {
        const created = await axios.post('/api/competicoes/eventos', payload);
        eventoId = created.data?.id;
      } else {
        await axios.put(`/api/competicoes/eventos/${editId}`, payload);
      }

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

  // Filtragem
  const filteredEventos = eventos.filter(ev => 
    ev.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.local?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      
      {/* 1. CABEÇALHO */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, boxShadow: 3 }}>
          <SportsMartialArtsIcon fontSize="large" />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Competições
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão completa de eventos e taxas por categoria.
          </Typography>
        </Box>
        <Button 
            variant="contained" 
            size="large"
            startIcon={<AddCircleOutlineIcon />} 
            onClick={openCreate}
            sx={{ fontWeight: 'bold', px: 3, py: 1.5, borderRadius: 2 }}
        >
          Criar Competição
        </Button>
      </Box>

      {/* 2. ALERTS */}
      {(error || success) && (
        <Box sx={{ mb: 3 }}>
          {error && <Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)} variant="filled">{success}</Alert>}
        </Box>
      )}

      {/* 3. BARRA DE BUSCA E FILTROS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField 
            size="small"
            placeholder="Buscar por nome ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            }}
            sx={{ flexGrow: 1, maxWidth: 500 }}
        />
        <Chip label={`${filteredEventos.length} registros`} color="default" variant="outlined" />
      </Paper>

      {/* 4. LISTAGEM */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'grey.100', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
          <ListAltIcon color="primary" />
          <Typography variant="h6" color="text.primary" fontWeight="bold">
            Eventos Cadastradas
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Evento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Modalidade</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : filteredEventos.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum evento encontrado.</TableCell></TableRow>
              ) : (
                filteredEventos.map(ev => {
                    const statusObj = STATUS.find(s => s.value === ev.status) || { label: ev.status, color: 'default' };
                    return (
                        <TableRow key={ev.id} hover>
                            <TableCell><Chip label={`#${ev.id}`} size="small" /></TableCell>
                            <TableCell>
                            <Typography fontWeight={700} color="primary.main">{ev.nome}</Typography>
                            <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                                <SportsMartialArtsIcon fontSize="inherit"/> {ev.local || 'Local não definido'}
                            </Typography>
                            </TableCell>
                            <TableCell>{ev?.modalidadeMae?.nome || '—'}</TableCell>
                            <TableCell>
                                <Chip 
                                    icon={<EventIcon fontSize="small"/>} 
                                    label={new Date(ev.data_evento).toLocaleDateString('pt-BR')} 
                                    variant="outlined" 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell>
                                <Chip label={statusObj.label} color={statusObj.color} size="small" sx={{ fontWeight: 'bold' }} />
                            </TableCell>
                            <TableCell align="right">
                            <Tooltip title="Editar">
                                <IconButton onClick={() => openEdit(ev)} color="primary" sx={{ bgcolor: 'primary.50', mr: 1 }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancelar / Excluir">
                                <IconButton onClick={() => handleDelete(ev)} color="error" sx={{ bgcolor: 'error.50' }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            </TableCell>
                        </TableRow>
                    );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- DIALOG (MODAL) --- */}
      <Dialog 
        open={open} 
        onClose={() => !saving && setOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editId ? 'Editar Competição' : 'Nova Competição'}
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ bgcolor: '#f5f5f5' }}>
          <Grid container spacing={3}>
            
            {/* SEÇÃO 1: DADOS GERAIS */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                        1. Informações Básicas
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Nome do Evento"
                            fullWidth
                            value={form.nome}
                            onChange={(e) => setForm(s => ({ ...s, nome: e.target.value }))}
                            disabled={saving}
                            required
                        />
                         <FormControl fullWidth required>
                            <InputLabel id="modMae">Modalidade Principal</InputLabel>
                            <Select
                            labelId="modMae"
                            value={form.modalidade_id}
                            label="Modalidade Principal"
                            onChange={(e) => setForm(s => ({ ...s, modalidade_id: e.target.value }))}
                            disabled={saving}
                            >
                            {modalidadesMae.map(m => (
                                <MenuItem key={m.id} value={String(m.id)}>{m.nome}</MenuItem>
                            ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Escopo</InputLabel>
                            <Select
                            value={form.escopo}
                            label="Escopo"
                            onChange={(e) => setForm(s => ({ ...s, escopo: e.target.value }))}
                            disabled={saving}
                            >
                            {ESCOPOS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                            value={form.status}
                            label="Status"
                            onChange={(e) => setForm(s => ({ ...s, status: e.target.value }))}
                            disabled={saving}
                            >
                            {STATUS.map(o => (
                                <MenuItem key={o.value} value={o.value}>
                                    <Chip label={o.label} color={o.color} size="small" />
                                </MenuItem>
                            ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>
            </Grid>

            {/* SEÇÃO 2: DATAS E LOCAL */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                        2. Quando e Onde?
                    </Typography>
                    <Stack spacing={2}>
                         <TextField
                            label="Local / Ginásio"
                            fullWidth
                            value={form.local}
                            onChange={(e) => setForm(s => ({ ...s, local: e.target.value }))}
                            disabled={saving}
                            placeholder="Ex: Ginásio Ibirapuera"
                        />
                         <TextField
                            label="Descrição / Detalhes"
                            fullWidth
                            multiline
                            minRows={3}
                            value={form.descricao}
                            onChange={(e) => setForm(s => ({ ...s, descricao: e.target.value }))}
                            disabled={saving}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Início"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={form.data_evento}
                                onChange={(e) => setForm(s => ({ ...s, data_evento: e.target.value }))}
                                disabled={saving}
                                required
                            />
                            <TextField
                                label="Fim"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                value={form.data_fim}
                                onChange={(e) => setForm(s => ({ ...s, data_fim: e.target.value }))}
                                disabled={saving}
                            />
                        </Stack>
                    </Stack>
                </Paper>
            </Grid>

            {/* SEÇÃO 3: CONFIGURAÇÃO DE TAXAS */}
            <Grid item xs={12} md={4}>
                 <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                        3. Financeiro
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Taxa Base (Padrão)"
                            type="number"
                            fullWidth
                            value={form.taxa_inscricao}
                            onChange={(e) => setForm(s => ({ ...s, taxa_inscricao: e.target.value }))}
                            disabled={saving}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                            }}
                            helperText="Valor aplicado caso a submodalidade não tenha taxa específica."
                        />
                        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                            Defina as taxas específicas para cada categoria na tabela abaixo.
                        </Alert>
                    </Stack>
                 </Paper>
            </Grid>

            {/* SEÇÃO 4: SUBMODALIDADES */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'grey.200', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography fontWeight={700} color="text.primary">
                    4. Seleção de Categorias e Taxas Específicas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Marque as categorias disponíveis neste evento e ajuste o preço se necessário.
                    </Typography>
                </Box>
                
                {!form.modalidade_id ? (
                  <Box p={4} textAlign="center">
                      <Typography color="text.secondary">Selecione uma <b>Modalidade Principal</b> acima para carregar as opções.</Typography>
                  </Box>
                ) : submodalidades.length === 0 ? (
                  <Box p={4} textAlign="center">
                       <Alert severity="warning">Nenhuma submodalidade cadastrada para esta modalidade mãe.</Alert>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: 70, bgcolor: 'white' }}>Ativo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white' }}>Submodalidade</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', width: 200, bgcolor: 'white' }}>Taxa Específica (R$)</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {submodalidades.map(sm => {
                            const state = modsState[sm.id] || { selected: false, taxa: 0 };
                            return (
                            <TableRow key={sm.id} hover selected={!!state.selected}>
                                <TableCell>
                                <Checkbox
                                    checked={!!state.selected}
                                    onChange={(e) => toggleMod(sm.id, e.target.checked)}
                                    color="primary"
                                />
                                </TableCell>
                                <TableCell>
                                <Typography fontWeight={600} variant="body2">{sm.nome}</Typography>
                                <Chip label={sm.code} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                                </TableCell>
                                <TableCell>
                                <TextField
                                    type="number"
                                    size="small"
                                    fullWidth
                                    value={state.taxa}
                                    disabled={!state.selected}
                                    onChange={(e) => setTaxa(sm.id, e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                    }}
                                    sx={{ bgcolor: 'white' }}
                                />
                                </TableCell>
                            </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: 'grey.100' }}>
          <Button onClick={() => setOpen(false)} disabled={saving} color="inherit" size="large">
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={saving} 
            size="large"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ px: 4 }}
          >
            {saving ? 'Salvando...' : 'Salvar Competição'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}