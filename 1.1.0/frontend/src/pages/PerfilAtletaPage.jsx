import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

// --- Importações MUI ---
import {
  Container, Box, Typography, TextField, Button, Grid,
  CircularProgress, Alert, Divider, Avatar, IconButton,
  Paper, Zoom, Skeleton, InputAdornment, Snackbar,
  Badge, FormControl, InputLabel, Select, MenuItem, Grow
} from '@mui/material';

// --- Ícones ---
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import BadgeIcon from '@mui/icons-material/Badge'; // Para CPF/RG
import PhoneIcon from '@mui/icons-material/Phone';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WcIcon from '@mui/icons-material/Wc'; // Ícone para Sexo

// --- Funções de Máscara ---
const maskCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskTelefone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCEP = (value) => {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
};

function PerfilAtletaPage() {
  const { user } = useAuth();
  
  // --- Estados ---
  const [formData, setFormData] = useState({
    nome_completo: '', 
    data_nascimento: '', 
    sexo: '', // <--- ADICIONADO NO ESTADO
    cpf: '', 
    rg: '',
    logradouro: '', 
    cep: '', 
    bairro: '', 
    cidade: '', 
    estado: '',
    telefone_contato: '', 
    foto_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);

  // 1. Carregar dados
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/atletas/me');
        if (response.data) {
          const d = response.data;
          setFormData({
            ...d,
            data_nascimento: d.data_nascimento ? d.data_nascimento.split('T')[0] : '',
            sexo: d.sexo || '', // <--- MAPEANDO O CAMPO SEXO
            cpf: d.cpf ? maskCPF(d.cpf) : '',
            telefone_contato: d.telefone_contato ? maskTelefone(d.telefone_contato) : '',
            cep: d.cep ? maskCEP(d.cep) : ''
          });
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setError('Erro ao carregar seus dados. Tente novamente.');
        }
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchPerfil();
  }, []);

  // 2. CEP Automático
  const handleCEPBlur = async (e) => {
    const cepLimpo = e.target.value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
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

  // 3. Updates de Campo
  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'cpf') val = maskCPF(value);
    if (name === 'telefone_contato') val = maskTelefone(value);
    if (name === 'cep') val = maskCEP(value);
    setFormData({ ...formData, [name]: val });
  };

  // 4. Upload de Foto
  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append('foto', file);

    try {
      const res = await axios.post('/api/atletas/me/foto', fileData);
      setFormData(prev => ({ ...prev, foto_url: res.data.foto_url }));
      setToastOpen(true);
    } catch (err) {
      setError("Falha ao enviar a foto. Verifique se é uma imagem válida.");
    }
  };

  // 5. Salvar Perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await axios.post('/api/atletas/me', formData);
      setToastOpen(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar os dados.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  // --- Renderização Loading ---
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" height={60} width="60%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* Mensagem de Erro Global */}
      {error && (
        <Zoom in>
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Snackbar Sucesso */}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={4000} 
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          Perfil atualizado com sucesso!
        </Alert>
      </Snackbar>

      <Grid container spacing={4}>
        
        {/* --- COLUNA DA ESQUERDA: IDENTIDADE (Com animação Grow) --- */}
        <Grid item xs={12} md={4}>
          <Grow in={true} timeout={500}>
            <Paper 
              elevation={4} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)', // Gradiente suave
                position: 'sticky',
                top: 20
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <label htmlFor="upload-button">
                      <input accept="image/*" id="upload-button" type="file" style={{ display: 'none' }} onChange={handleUploadFoto} />
                      <IconButton 
                        color="primary" 
                        aria-label="enviar foto" 
                        component="span"
                        sx={{ bgcolor: 'white', boxShadow: 3, '&:hover': { bgcolor: '#f5f5f5' } }}
                      >
                        <PhotoCamera fontSize="small" />
                      </IconButton>
                    </label>
                  }
                >
                  <Avatar
                    src={formData.foto_url ? `/api/uploads/${formData.foto_url}` : ''}
                    sx={{ 
                      width: 150, 
                      height: 150, 
                      border: '5px solid white', 
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                      bgcolor: 'grey.300'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 80, color: 'grey.500' }} />
                  </Avatar>
                </Badge>
              </Box>
              
              <Typography variant="h5" fontWeight="800" color="primary.main" sx={{ mb: 0.5 }}>
                {formData.nome_completo?.split(' ')[0] || 'Atleta'}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                {user?.email}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'success.main', bgcolor: 'success.light', py: 0.5, px: 2, borderRadius: 20, mx: 'auto', width: 'fit-content' }}>
                <CheckCircleIcon fontSize="small" sx={{ color: 'success.dark' }} />
                <Typography variant="caption" fontWeight="bold" sx={{ color: 'success.dark' }}>CADASTRO ATIVO</Typography>
              </Box>
            </Paper>
          </Grow>
        </Grid>

        {/* --- COLUNA DA DIREITA: FORMULÁRIO --- */}
        <Grid item xs={12} md={8}>
          <Box component="form" onSubmit={handleSubmit}>
            
            {/* Seção 1: Dados Pessoais */}
            <Grow in={true} timeout={800}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 1.5 }} /> Dados Pessoais
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField 
                        name="nome_completo" 
                        label="Nome Completo" 
                        fullWidth 
                        required 
                        value={formData.nome_completo} 
                        onChange={handleChange}
                        variant="outlined"
                        placeholder="Como consta no documento"
                      />
                    </Grid>
                    
                    {/* --- CAMPO CPF --- */}
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        name="cpf" 
                        label="CPF" 
                        fullWidth 
                        required 
                        value={formData.cpf} 
                        onChange={handleChange} 
                        inputProps={{ maxLength: 14 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><BadgeIcon color="action" fontSize="small"/></InputAdornment>,
                        }}
                      />
                    </Grid>

                    {/* --- CAMPO DATA NASCIMENTO --- */}
                    <Grid item xs={12} sm={3}>
                      <TextField 
                        name="data_nascimento" 
                        label="Nascimento" 
                        type="date" 
                        fullWidth 
                        required 
                        value={formData.data_nascimento} 
                        onChange={handleChange} 
                        InputLabelProps={{ shrink: true }} 
                      />
                    </Grid>

                    {/* --- CAMPO SEXO (NOVO) --- */}
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth required>
                        <InputLabel id="sexo-label">Sexo</InputLabel>
                        <Select
                          labelId="sexo-label"
                          name="sexo"
                          value={formData.sexo}
                          label="Sexo"
                          onChange={handleChange}
                          startAdornment={
                             <InputAdornment position="start" sx={{ mr: 1, ml: -0.5 }}>
                                <WcIcon color="action" fontSize="small"/>
                             </InputAdornment>
                          }
                        >
                          <MenuItem value="M">Masculino</MenuItem>
                          <MenuItem value="F">Feminino</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField 
                        name="rg" 
                        label="RG" 
                        fullWidth 
                        value={formData.rg} 
                        onChange={handleChange} 
                        placeholder="Número / Órgão"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        name="telefone_contato" 
                        label="Celular / WhatsApp" 
                        fullWidth 
                        value={formData.telefone_contato} 
                        onChange={handleChange} 
                        inputProps={{ maxLength: 15 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><PhoneIcon color="action" fontSize="small"/></InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Grow>

            {/* Seção 2: Endereço */}
            <Grow in={true} timeout={1100}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', mb: 2 }}>
                  <HomeIcon color="primary" sx={{ mr: 1.5 }} /> Endereço
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <TextField 
                        name="cep" 
                        label="CEP" 
                        fullWidth 
                        value={formData.cep} 
                        onChange={handleChange} 
                        onBlur={handleCEPBlur}
                        placeholder="00000-000"
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField 
                        name="logradouro" 
                        label="Endereço" 
                        fullWidth 
                        value={formData.logradouro} 
                        onChange={handleChange} 
                        placeholder="Rua, Avenida, Número..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField 
                        name="bairro" 
                        label="Bairro" 
                        fullWidth 
                        value={formData.bairro} 
                        onChange={handleChange} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField 
                        name="cidade" 
                        label="Cidade" 
                        fullWidth 
                        value={formData.cidade} 
                        onChange={handleChange} 
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LocationCityIcon color="action" fontSize="small"/></InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField 
                        name="estado" 
                        label="UF" 
                        fullWidth 
                        value={formData.estado} 
                        onChange={handleChange} 
                        inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }} 
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Grow>

            {/* Botão de Ação */}
            <Grow in={true} timeout={1400}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                  sx={{ 
                    py: 1.5, 
                    px: 5, 
                    fontWeight: 'bold', 
                    borderRadius: 3,
                    boxShadow: 6,
                    fontSize: '1rem',
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                    }
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Grow>

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default PerfilAtletaPage;