import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Importações Completas do MUI ---
import {
  Box, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Alert, CircularProgress, Grid, Tooltip,
  Avatar, Zoom, Container, Chip, FormControl, InputLabel,
  Select, MenuItem, FormHelperText
} from '@mui/material';

// --- Ícones ---
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SchoolIcon from '@mui/icons-material/School'; // Ícone de Graduação
import StarIcon from '@mui/icons-material/Star';
import ListAltIcon from '@mui/icons-material/ListAlt';

function ManageGraduacoesPage() {
  // --- Estados ---
  const [graduacoes, setGraduacoes] = useState([]);
  const [modalidades, setModalidades] = useState([]); // Para o Select
  
  // Campos do Formulário
  const [formData, setFormData] = useState({
    nome: '',
    modalidade_id: '',
    ordem: '',
    restricao_idade: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- Buscas Iniciais ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // Busca modalidades (para o select) e graduações em paralelo
      const [resGrad, resMod] = await Promise.all([
        axios.get('/api/graduacoes'),
        axios.get('/api/modalidades')
      ]);
      
      setGraduacoes(resGrad.data);
      setModalidades(resMod.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Manipuladores ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validação simples
    if (!formData.nome || !formData.modalidade_id) {
      setError('Nome da graduação e Modalidade são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      await axios.post('/api/graduacoes', formData);
      
      setSuccessMsg('Graduação cadastrada com sucesso!');
      setFormData({ nome: '', modalidade_id: '', ordem: '', restricao_idade: '' }); // Limpa form
      
      // Atualiza a lista
      const res = await axios.get('/api/graduacoes');
      setGraduacoes(res.data);

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao criar graduação.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza? Isso pode afetar atletas vinculados a esta faixa.')) return;

    try {
      await axios.delete(`/api/graduacoes/${id}`);
      setSuccessMsg('Graduação removida.');
      const res = await axios.get('/api/graduacoes');
      setGraduacoes(res.data);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('Erro ao deletar. Verifique se há atletas usando esta graduação.');
    }
  };

  return (
    <Container maxWidth="lg">
      
      {/* --- 1. CABEÇALHO --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, boxShadow: 3 }}>
          <SchoolIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Graduações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cadastre faixas, graus ou níveis (Ex: Faixa Branca, Grau 1, Dan...).
          </Typography>
        </Box>
      </Box>

      {/* --- FEEDBACK --- */}
      <Box sx={{ mb: 2, height: 50 }}>
        {successMsg && <Zoom in><Alert severity="success">{successMsg}</Alert></Zoom>}
        {error && <Zoom in><Alert severity="error">{error}</Alert></Zoom>}
      </Box>

      {/* --- 2. CARD DE CADASTRO --- */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, borderLeft: '6px solid #FF8C00' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddCircleOutlineIcon color="primary" />
          Nova Graduação
        </Typography>

        <form onSubmit={handleCreate}>
          <Grid container spacing={3}>
            {/* Linha 1 */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome da Graduação"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                fullWidth
                placeholder="Ex: Faixa Branca, Preta 1º Dan"
                required
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={saving}>
                <InputLabel>Modalidade</InputLabel>
                <Select
                  name="modalidade_id"
                  value={formData.modalidade_id}
                  label="Modalidade"
                  onChange={handleChange}
                >
                  {modalidades.length === 0 && <MenuItem disabled>Carregando modalidades...</MenuItem>}
                  {modalidades.map((mod) => (
                    <MenuItem key={mod.id} value={mod.id}>
                      {mod.nome}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>A qual esporte esta faixa pertence?</FormHelperText>
              </FormControl>
            </Grid>

            {/* Linha 2 */}
            <Grid item xs={6} md={3}>
              <TextField
                label="Ordem (Nível)"
                name="ordem"
                type="number"
                value={formData.ordem}
                onChange={handleChange}
                fullWidth
                placeholder="Ex: 1"
                helperText="Menor número = Iniciante"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Idade Mínima"
                name="restricao_idade"
                type="number"
                value={formData.restricao_idade}
                onChange={handleChange}
                fullWidth
                placeholder="Ex: 18"
                disabled={saving}
              />
            </Grid>
            
            {/* Botão Salvar */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
               <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={saving}
                color="secondary"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SchoolIcon />}
                sx={{ height: '56px', fontWeight: 'bold' }}
              >
                {saving ? 'Gravando...' : 'Cadastrar Graduação'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* --- 3. LISTAGEM --- */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'secondary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">
            Lista de Graduações
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Modalidade</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ordem</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Idade Mín.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : graduacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma graduação cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                graduacoes.map((grad) => (
                  <TableRow key={grad.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{grad.nome}</TableCell>
                    <TableCell>
                      {/* Chip para destacar a modalidade */}
                      <Chip 
                        label={grad.modalidade?.nome || 'Sem Modalidade'} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <StarIcon fontSize="inherit" color="disabled" />
                        {grad.ordem || '-'}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{grad.restricao_idade ? `${grad.restricao_idade} anos` : '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Excluir">
                        <IconButton onClick={() => handleDelete(grad.id)} color="error" size="small" sx={{ bgcolor: 'error.50' }}>
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
        
        {!loading && graduacoes.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'right', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">Total: {graduacoes.length}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ManageGraduacoesPage;