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
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'; // Ícone de Academia
import ListAltIcon from '@mui/icons-material/ListAlt';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'; // Novo ícone importado

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
const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const maskCEP = (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');

function ManageAcademiasPage() {
  // --- Estados ---
  const [academias, setAcademias] = useState([]);
  const [federacoes, setFederacoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Estado para controlar EDICÃO (null = criando, número = editando ID)
  const [editingId, setEditingId] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    nome: '', cnpj: '', email: '', telefone: '', federacao_id: '', responsavel_id: ''
  });
  const [endereco, setEndereco] = useState({
    logradouro: '', cep: '', bairro: '', cidade: '', estado: ''
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- Busca de Dados ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAcad, resFed, resUsers] = await Promise.all([
        axios.get('/api/academias'),
        axios.get('/api/federacoes'),
        axios.get('/api/usuarios?tipo=admin,professor,treinador')
      ]);
      setAcademias(resAcad.data);
      setFederacoes(resFed.data);
      setUsuarios(resUsers.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Manipuladores ---
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'telefone') value = maskPhone(value);
    setFormData({ ...formData, [name]: value });
  };

  const handleEnderecoChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cep') value = maskCEP(value);
    setEndereco({ ...endereco, [name]: value });
  };

  // Busca CEP automático
  const handleCEPBlur = async () => {
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (!res.data.erro) {
          setEndereco(prev => ({
            ...prev,
            logradouro: res.data.logradouro,
            bairro: res.data.bairro,
            cidade: res.data.localidade,
            estado: res.data.uf
          }));
        }
      } catch (err) {
        console.error("Erro no CEP", err);
      }
    }
  };

  // --- Lógica de Preencher Formulário para Edição ---
  const handleEdit = (academia) => {
    setEditingId(academia.id);
    
    // Preenche dados principais
    setFormData({
      nome: academia.nome,
      cnpj: academia.cnpj ? maskCNPJ(academia.cnpj) : '',
      email: academia.email || '',
      telefone: academia.telefone ? maskPhone(academia.telefone) : '',
      federacao_id: academia.federacao_id || '',
      responsavel_id: academia.responsavel_id || ''
    });

    // Preenche endereço
    setEndereco({
      logradouro: academia.logradouro || '',
      cep: academia.cep ? maskCEP(academia.cep) : '',
      bairro: academia.bairro || '',
      cidade: academia.cidade || '',
      estado: academia.estado || ''
    });

    // Rola a página para o topo (formulário)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Cancelar Edição ---
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ nome: '', cnpj: '', email: '', telefone: '', federacao_id: '', responsavel_id: '' });
    setEndereco({ logradouro: '', cep: '', bairro: '', cidade: '', estado: '' });
  };

  // --- Submit (Criar ou Editar) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.nome || !formData.federacao_id || !formData.responsavel_id) {
      setError("Nome, Federação e Responsável são obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      const dadosCompletos = { ...formData, ...endereco };

      if (editingId) {
        // --- MODO EDIÇÃO (PUT) ---
        await axios.put(`/api/academias/${editingId}`, dadosCompletos);
        setSuccessMsg('Academia atualizada com sucesso!');
      } else {
        // --- MODO CRIAÇÃO (POST) ---
        await axios.post('/api/academias', dadosCompletos);
        setSuccessMsg('Academia cadastrada com sucesso!');
      }
      
      // Limpa formulário e reseta modo de edição
      handleCancelEdit();
      
      fetchData(); // Recarrega lista
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar academia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza? Isso pode falhar se houver atletas nesta academia.")) return;
    try {
      await axios.delete(`/api/academias/${id}`);
      setSuccessMsg('Academia removida.');
      if (editingId === id) handleCancelEdit();
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao deletar academia.');
    }
  };

  return (
    <Container maxWidth="lg">
      
      {/* --- 1. CABEÇALHO --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, boxShadow: 3 }}>
          <FitnessCenterIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Gerir Academias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cadastre os centros de treinamento e vincule seus professores.
          </Typography>
        </Box>
      </Box>

      {/* --- FEEDBACK --- */}
      <Box sx={{ mb: 2, height: 50 }}>
        {successMsg && <Zoom in><Alert severity="success">{successMsg}</Alert></Zoom>}
        {error && <Zoom in><Alert severity="error">{error}</Alert></Zoom>}
      </Box>

      {/* --- 2. CARD DE CADASTRO / EDIÇÃO --- */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, borderLeft: editingId ? '6px solid #FF8C00' : '6px solid #FF8C00' }}>
        
        {/* Cabeçalho do Card (Sem o botão cancelar antigo) */}
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {editingId ? <EditIcon color="primary" /> : <AddCircleOutlineIcon color="warning" />}
          {editingId ? "Editar Academia" : "Nova Academia"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Coluna 1: Dados Principais */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                  <BusinessIcon fontSize="small"/> Dados Corporativos
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Nome da Academia" name="nome" value={formData.nome} onChange={handleChange} fullWidth required size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <TextField label="CNPJ" name="cnpj" value={formData.cnpj} onChange={handleChange} fullWidth size="small" placeholder="00.000.000/0000-00" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <TextField label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} fullWidth size="small" placeholder="(00) 00000-0000" disabled={saving} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" required disabled={saving}>
                      <InputLabel>Federação Vinculada</InputLabel>
                      <Select name="federacao_id" value={formData.federacao_id} label="Federação Vinculada" onChange={handleChange}>
                        {federacoes.map(fed => <MenuItem key={fed.id} value={fed.id}>{fed.nome}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" required disabled={saving}>
                      <InputLabel>Responsável Técnico</InputLabel>
                      <Select name="responsavel_id" value={formData.responsavel_id} label="Responsável Técnico" onChange={handleChange}>
                        {usuarios.map(user => <MenuItem key={user.id} value={user.id}>{user.nome || user.email}</MenuItem>)}
                      </Select>
                      <FormHelperText>Professor ou Treinador principal</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Coluna 2: Endereço */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                  <LocationOnIcon fontSize="small"/> Localização
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField label="CEP" name="cep" value={endereco.cep} onChange={handleEnderecoChange} onBlur={handleCEPBlur} fullWidth size="small" placeholder="00000-000" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField label="Logradouro" name="logradouro" value={endereco.logradouro} onChange={handleEnderecoChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Bairro" name="bairro" value={endereco.bairro} onChange={handleEnderecoChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Cidade" name="cidade" value={endereco.cidade} onChange={handleEnderecoChange} fullWidth size="small" disabled={saving} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Estado" name="estado" value={endereco.estado} onChange={handleEnderecoChange} fullWidth size="small" inputProps={{ maxLength: 2 }} disabled={saving} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Botões de Ação (ATUALIZADO PARA FICAR IGUAL AO FEDERAÇÕES) */}
            <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color={editingId ? "primary" : "warning"} 
                size="large" 
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : (editingId ? <SaveIcon /> : <AddCircleOutlineIcon />)}
                sx={{ minWidth: 200, fontWeight: 'bold' }}
              >
                {saving ? (editingId ? 'Atualizando...' : 'Cadastrando...') : (editingId ? 'Atualizar Academia' : 'Cadastrar Academia')}
              </Button>

              {editingId && (
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={handleCancelEdit}
                  startIcon={<CleaningServicesIcon />}
                  size="large"
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
            Academias Cadastradas
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome da Academia</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Federação</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Responsável</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : academias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma academia cadastrada.</TableCell>
                </TableRow>
              ) : (
                academias.map((ac) => (
                  <TableRow key={ac.id} hover selected={editingId === ac.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{ac.nome}</TableCell>
                    <TableCell>
                      {ac.federacao ? (
                         <Chip label={ac.federacao.nome} size="small" color="primary" variant="outlined" />
                      ) : (
                         <Chip label="Sem Federação" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {ac.responsavel?.nome?.charAt(0) || '?'}
                            </Avatar>
                            <Typography variant="body2">{ac.responsavel?.nome || ac.responsavel?.email || 'N/A'}</Typography>
                        </Box>
                    </TableCell>
                    <TableCell align="right">
                      {/* Botão de EDITAR */}
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleEdit(ac)} color="primary" size="small" sx={{ mr: 1, bgcolor: 'primary.50' }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Botão de EXCLUIR */}
                      <Tooltip title="Excluir">
                        <IconButton onClick={() => handleDelete(ac.id)} color="error" size="small" sx={{ bgcolor: 'error.50' }}>
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
        
        {!loading && academias.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'right', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">Total: {academias.length}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ManageAcademiasPage;