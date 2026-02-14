import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
import CorporateFareIcon from '@mui/icons-material/CorporateFare'; // Ícone Principal
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ListAltIcon from '@mui/icons-material/ListAlt';

// --- Funções de Máscara ---
const maskCNPJ = (v) => {
  return v
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};
const maskCEP = (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

function ManageFederacoesPage() {
  // --- Estados ---
  const [federacoes, setFederacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    nome: '', cnpj: '', email: '', telefone: '',
    cep: '', logradouro: '', bairro: '', cidade: '', estado: ''
  });

  // --- Busca de Dados ---
  const fetchFederacoes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/federacoes');
      setFederacoes(res.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar federações:", err);
      setError("Erro ao carregar lista de federações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFederacoes();
  }, []);

  // --- Manipuladores ---
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'cep') value = maskCEP(value);
    if (name === 'telefone') value = maskPhone(value);
    setFormData({ ...formData, [name]: value });
  };

  const handleCEPBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!res.data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: res.data.logradouro,
            bairro: res.data.bairro,
            cidade: res.data.localidade,
            estado: res.data.uf
          }));
        }
      } catch (err) {
        console.error("Erro CEP", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    if (!formData.nome) {
      setError("O nome da federação é obrigatório.");
      setSaving(false);
      return;
    }

    try {
      if (editMode && selectedId) {
        await axios.put(`/api/federacoes/${selectedId}`, formData);
        setSuccessMsg("Federação atualizada com sucesso!");
      } else {
        await axios.post('/api/federacoes', formData);
        setSuccessMsg("Federação cadastrada com sucesso!");
      }
      
      handleCancelEdit();
      fetchFederacoes();
      setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err) {
      setError(err.response?.data?.msg || "Erro ao salvar federação.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fed) => {
    setEditMode(true);
    setSelectedId(fed.id);
    setFormData({
      nome: fed.nome || '',
      cnpj: fed.cnpj || '',
      email: fed.email || '',
      telefone: fed.telefone || '',
      cep: fed.cep || '',
      logradouro: fed.logradouro || '',
      bairro: fed.bairro || '',
      cidade: fed.cidade || '',
      estado: fed.estado || ''
    });
    setSuccessMsg(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      nome: '', cnpj: '', email: '', telefone: '',
      cep: '', logradouro: '', bairro: '', cidade: '', estado: ''
    });
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta federação?")) return;
    try {
      await axios.delete(`/api/federacoes/${id}`);
      setSuccessMsg("Federação removida.");
      fetchFederacoes();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Erro ao excluir. Verifique vínculos.");
    }
  };

  return (
    <Container maxWidth="lg">
      
      {/* --- 1. CABEÇALHO --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.dark', width: 56, height: 56, boxShadow: 3 }}>
          <CorporateFareIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Gerir Federações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administre as entidades estaduais ou nacionais parceiras.
          </Typography>
        </Box>
      </Box>

      {/* --- FEEDBACK --- */}
      <Box sx={{ mb: 2, height: 50 }}>
        {successMsg && <Zoom in><Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert></Zoom>}
        {error && <Zoom in><Alert severity="error" onClose={() => setError(null)}>{error}</Alert></Zoom>}
      </Box>

      {/* --- 2. CARD DE CADASTRO --- */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, borderLeft: '6px solid #7b1fa2' }}> {/* Roxo */}
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {editMode ? <EditIcon color="secondary" /> : <SaveIcon color="primary" />}
          {editMode ? "Editar Federação" : "Nova Federação"}
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Coluna 1: Dados Institucionais */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fdfbff', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                  <BusinessIcon fontSize="small"/> Dados Institucionais
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Nome da Federação" name="nome" value={formData.nome} onChange={handleChange} fullWidth required size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="CNPJ" name="cnpj" value={formData.cnpj} onChange={handleChange} fullWidth size="small" placeholder="00.000.000/0000-00" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} fullWidth size="small" placeholder="(00) 00000-0000" disabled={saving} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="E-mail Oficial" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Coluna 2: Endereço */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fdfbff', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                  <LocationOnIcon fontSize="small"/> Localização
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField label="CEP" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCEPBlur} fullWidth size="small" placeholder="00000-000" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField label="Logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="UF" name="estado" value={formData.estado} onChange={handleChange} fullWidth size="small" inputProps={{ maxLength: 2 }} disabled={saving} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Botões */}
            <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color={editMode ? "secondary" : "primary"}
                disabled={saving}
                size="large"
                startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
                sx={{ minWidth: 150, fontWeight: 'bold' }}
              >
                {saving ? "Processando..." : (editMode ? "Atualizar" : "Cadastrar")}
              </Button>
              
              {editMode && (
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={handleCancelEdit}
                  startIcon={<CleaningServicesIcon />}
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
        <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">
            Federações Cadastradas
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>CNPJ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Localidade</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : federacoes.length === 0 ? (
                 <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma federação cadastrada.</TableCell></TableRow>
              ) : (
                federacoes.map((fed) => (
                  <TableRow key={fed.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{fed.nome}</TableCell>
                    <TableCell>{fed.cnpj || '-'}</TableCell>
                    <TableCell>
                        {fed.cidade ? <Chip label={`${fed.cidade}/${fed.estado}`} size="small" variant="outlined" /> : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleEdit(fed)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => handleDelete(fed.id)} size="small" sx={{ bgcolor: 'error.50' }}>
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
        
        {!loading && federacoes.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'right', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">Total: {federacoes.length}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ManageFederacoesPage;