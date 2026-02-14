import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Importações Completas do MUI ---
import {
  Box, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Alert, CircularProgress, Grid, Tooltip,
  Avatar, Zoom, Container, Chip
} from '@mui/material';

// --- Ícones ---
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts'; // Ícone temático
import ListAltIcon from '@mui/icons-material/ListAlt';

function ManageModalidadesPage() {
  // --- Estados ---
  const [modalidades, setModalidades] = useState([]);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null); // Feedback de sucesso
  const [saving, setSaving] = useState(false); // Estado de salvando

  // Buscar modalidades
  const fetchModalidades = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/modalidades');
      setModalidades(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a lista de modalidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModalidades();
  }, []);

  // Criar Modalidade
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!nome.trim()) {
      setFormError('O nome da modalidade não pode estar vazio.');
      return;
    }

    try {
      setSaving(true);
      await axios.post('/api/modalidades', { nome });
      setNome(''); // Limpa o input
      setSuccessMsg('Modalidade cadastrada com sucesso!');
      fetchModalidades(); // Recarrega a lista
      
      // Remove a mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Erro ao criar modalidade.');
    } finally {
      setSaving(false);
    }
  };

  // Deletar Modalidade
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta modalidade?')) return;

    try {
      await axios.delete(`/api/modalidades/${id}`);
      fetchModalidades();
      setSuccessMsg('Modalidade removida.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.response?.data?.msg || 'Erro ao deletar modalidade.');
    }
  };

  return (
    <Container maxWidth="lg">
      
      {/* --- 1. CABEÇALHO DA PÁGINA --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: 3 }}>
          <SportsMartialArtsIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Modalidades
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os esportes e artes marciais disponíveis no sistema.
          </Typography>
        </Box>
      </Box>

      {/* --- FEEDBACK VISUAL --- */}
      <Box sx={{ mb: 2, height: 50 }}> {/* Altura fixa para evitar pulo de layout */}
        {successMsg && (
          <Zoom in>
            <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ width: '100%' }}>
              {successMsg}
            </Alert>
          </Zoom>
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </Box>

      {/* --- 2. ÁREA DE CADASTRO (CARD) --- */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, borderLeft: '6px solid #003366' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddCircleOutlineIcon color="secondary" />
          Nova Modalidade
        </Typography>
        
        <form onSubmit={handleCreate}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={8}>
              <TextField
                label="Nome da Modalidade"
                variant="outlined"
                fullWidth
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                error={!!formError}
                helperText={formError}
                placeholder="Ex: Jiu-Jitsu, Muay Thai, Boxe..."
                disabled={saving}
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
                sx={{ height: '56px', fontWeight: 'bold' }} // Altura para alinhar com o TextField
              >
                {saving ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* --- 3. LISTAGEM (TABELA) --- */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Cabeçalho da Tabela Visual */}
        <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">
            Modalidades Cadastradas
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome da Modalidade</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', width: '150px' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Carregando...</Typography>
                  </TableCell>
                </TableRow>
              ) : modalidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                    <Typography variant="h6" color="text.secondary">Nenhuma modalidade encontrada.</Typography>
                    <Typography variant="body2" color="text.disabled">Utilize o formulário acima para cadastrar a primeira.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                modalidades.map((mod) => (
                  <TableRow 
                    key={mod.id} 
                    hover 
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: '0.2s' }}
                  >
                    <TableCell component="th" scope="row">
                      <Chip label={`#${mod.id}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="500">{mod.nome}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Excluir Modalidade" arrow>
                        <IconButton 
                          aria-label="deletar" 
                          color="error"
                          onClick={() => handleDelete(mod.id)}
                          sx={{ 
                            bgcolor: 'error.50', 
                            '&:hover': { bgcolor: 'error.100' } 
                          }}
                        >
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
        
        {/* Rodapé da tabela com contagem */}
        {!loading && modalidades.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Total de registros: <strong>{modalidades.length}</strong>
            </Typography>
          </Box>
        )}
      </Paper>

    </Container>
  );
}

export default ManageModalidadesPage;