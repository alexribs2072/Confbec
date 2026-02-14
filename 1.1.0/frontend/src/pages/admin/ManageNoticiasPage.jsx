import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Importa o hook de autenticação para pegar o ID do autor
import { useAuth } from '../../context/AuthContext';
// Importa a função de formatação de data
import { formatarDataHoraBR } from '../../utils/dateUtils'; 

// --- Importações Completas do MUI ---
import {
  Box, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Alert, CircularProgress, Grid, Tooltip,
  Avatar, Zoom, Container, Chip, Divider
} from '@mui/material';

// --- Ícones ---
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NewspaperIcon from '@mui/icons-material/Newspaper'; // Ícone principal
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';

function ManageNoticiasPage() {
  // --- Estados ---
  const [noticias, setNoticias] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    conteudo: '',
    imagem_url: '',
  });
  const [editingId, setEditingId] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null); // Feedback de sucesso
  const [formError, setFormError] = useState(null);
  
  const { user } = useAuth(); // Para autor_id

  // --- Busca de Dados ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/noticias');
      setNoticias(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar notícias.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    // Validação
    if (!formData.titulo || !formData.conteudo) {
      setFormError("O Título e o Conteúdo são obrigatórios.");
      return;
    }

    const dataToSend = { ...formData, autor_id: user.id };

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(`/api/noticias/${editingId}`, dataToSend);
        setSuccessMsg("Notícia atualizada com sucesso!");
      } else {
        await axios.post('/api/noticias', dataToSend);
        setSuccessMsg("Notícia publicada com sucesso!");
      }

      // Reset
      setFormData({ titulo: '', subtitulo: '', conteudo: '', imagem_url: '' });
      setEditingId(null);
      fetchData();
      
      // Remove msg após 3s
      setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err) {
      setFormError(err.response?.data?.msg || `Erro ao salvar notícia.`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (noticia) => {
      setEditingId(noticia.id);
      setFormData({
          titulo: noticia.titulo,
          subtitulo: noticia.subtitulo || '',
          conteudo: noticia.conteudo,
          imagem_url: noticia.imagem_url || '',
      });
      setFormError(null);
      setSuccessMsg(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setFormData({ titulo: '', subtitulo: '', conteudo: '', imagem_url: '' });
      setFormError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja apagar esta notícia?")) return;
    try {
      await axios.delete(`/api/noticias/${id}`);
      setSuccessMsg("Notícia removida.");
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
       setError(err.response?.data?.msg || 'Erro ao deletar notícia.');
    }
  };

  return (
    <Container maxWidth="lg">
      
      {/* --- 1. CABEÇALHO --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: 3 }}>
          <NewspaperIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Central de Notícias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Publique novidades, resultados de campeonatos e avisos oficiais.
          </Typography>
        </Box>
      </Box>

      {/* --- FEEDBACK --- */}
      <Box sx={{ mb: 2, height: 50 }}>
        {successMsg && <Zoom in><Alert severity="success">{successMsg}</Alert></Zoom>}
        {error && <Zoom in><Alert severity="error">{error}</Alert></Zoom>}
      </Box>

      {/* --- 2. CARD DE FORMULÁRIO --- */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, borderLeft: '6px solid #1565c0' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          {editingId ? <EditIcon color="secondary" /> : <ArticleIcon color="primary" />}
          {editingId ? `Editando Notícia #${editingId}` : 'Nova Publicação'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Título e Subtítulo */}
            <Grid item xs={12} md={7}>
              <TextField
                name="titulo"
                label="Título da Notícia"
                placeholder="Ex: Resultados do Campeonato Estadual"
                variant="outlined"
                fullWidth
                required
                value={formData.titulo}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                name="subtitulo"
                label="Subtítulo (Opcional)"
                placeholder="Um breve resumo..."
                variant="outlined"
                fullWidth
                value={formData.subtitulo}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* URL da Imagem */}
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <ImageIcon color="action" sx={{ mr: 1, my: 0.5 }} />
                    <TextField
                        name="imagem_url"
                        label="URL da Imagem de Capa (Opcional)"
                        variant="standard"
                        fullWidth
                        value={formData.imagem_url}
                        onChange={handleChange}
                        placeholder="https://exemplo.com/imagem.jpg"
                        disabled={saving}
                    />
                </Box>
            </Grid>

            {/* Conteúdo */}
            <Grid item xs={12}>
              <TextField
                name="conteudo"
                label="Conteúdo da Notícia"
                multiline
                rows={8}
                variant="outlined"
                fullWidth
                required
                value={formData.conteudo}
                onChange={handleChange}
                placeholder="Escreva aqui o texto completo..."
                disabled={saving}
                sx={{ bgcolor: '#fafafa' }}
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color={editingId ? "secondary" : "primary"}
                size="large"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
                sx={{ minWidth: 150, fontWeight: 'bold' }}
              >
                {saving ? 'Publicando...' : (editingId ? 'Atualizar Notícia' : 'Publicar Notícia')}
              </Button>
              
              {editingId && (
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={cancelEdit}
                  startIcon={<CancelIcon />}
                >
                  Cancelar
                </Button>
              )}
            </Grid>

          </Grid>
        </form>
      </Paper>

      {/* --- 3. LISTAGEM --- */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'secondary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">
            Notícias Publicadas
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Data de Publicação</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Autor</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : noticias.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma notícia encontrada.</TableCell></TableRow>
              ) : (
                noticias.map((not) => (
                  <TableRow key={not.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                        {not.titulo}
                        {not.subtitulo && (
                            <Typography variant="caption" display="block" color="text.secondary">
                                {not.subtitulo.substring(0, 50)}...
                            </Typography>
                        )}
                    </TableCell>
                    <TableCell>
                        <Chip 
                            label={formatarDataHoraBR ? formatarDataHoraBR(not.publicada_em) : not.publicada_em} 
                            size="small" 
                            variant="outlined" 
                        />
                    </TableCell>
                    <TableCell>
                        <Tooltip title={`ID do Usuário: ${not.autor_id}`}>
                             <Chip label={`Admin #${not.autor_id}`} size="small" />
                        </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleEdit(not)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton onClick={() => handleDelete(not.id)} color="error" size="small" sx={{ bgcolor: 'error.50' }}>
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
        
        {!loading && noticias.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'right', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">Total: {noticias.length}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ManageNoticiasPage;