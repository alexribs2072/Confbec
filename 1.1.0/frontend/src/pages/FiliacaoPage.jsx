import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Importações MUI ---
import {
  Container, Typography, Box, Paper, Button,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  CircularProgress, Alert, Divider, Zoom
} from '@mui/material';
import Grid from '@mui/material/Grid'; // ✅ Grid v2
//import Grid from "@mui/material/Unstable_Grid2";

import BusinessIcon from '@mui/icons-material/Business';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import SchoolIcon from '@mui/icons-material/School';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SendIcon from '@mui/icons-material/Send';

function FiliacaoPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [academias, setAcademias] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [graduacoes, setGraduacoes] = useState([]);

  const [formData, setFormData] = useState({
    academia_id: '',
    modalidade_id: '',
    graduacao_id: '',
    professor_id: '',
  });

  const [loading, setLoading] = useState(true);
  const [loadingGraduacoes, setLoadingGraduacoes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resAcademias, resModalidades, resProfessores] = await Promise.all([
          axios.get('/api/academias'),
          axios.get('/api/modalidades'),
          axios.get('/api/usuarios?tipo=professor,treinador')
        ]);
        setAcademias(resAcademias.data);
        setModalidades(resModalidades.data);
        setProfessores(resProfessores.data);
      } catch (err) {
        setError("Erro ao carregar dados da página.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGraduacoes = async () => {
      if (formData.modalidade_id) {
        try {
          setLoadingGraduacoes(true);
          const response = await axios.get(`/api/graduacoes?modalidade_id=${formData.modalidade_id}`);
          setGraduacoes(response.data);
          setFormData(prev => ({ ...prev, graduacao_id: '' }));
        } catch (err) {
          setError("Erro ao buscar graduações.");
        } finally {
          setLoadingGraduacoes(false);
        }
      } else {
        setGraduacoes([]);
        setFormData(prev => ({ ...prev, graduacao_id: '' }));
      }
    };
    fetchGraduacoes();
  }, [formData.modalidade_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await axios.post('/api/filiacoes', formData);
      setSuccess(`Solicitação enviada! Status: ${response.data.status}`);
      setTimeout(() => navigate('/minhas-filiacoes'), 2500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao enviar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Solicitar Nova Filiação
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preencha os detalhes abaixo para se filiar a uma academia e modalidade.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Zoom in><Alert severity="success" sx={{ mb: 3 }}>{success}</Alert></Zoom>}

      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            {/* Academia */}
            <Grid xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="600">Instituição</Typography>
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Selecione sua Academia</InputLabel>
                <Select
                  name="academia_id"
                  value={formData.academia_id}
                  label="Selecione sua Academia"
                  onChange={handleChange}
                >
                  {academias.map(ac => (
                    <MenuItem key={ac.id} value={ac.id}>{ac.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12}><Divider /></Grid>

            {/* Modalidade */}
            <Grid xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SportsMartialArtsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="600">Modalidade</Typography>
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Selecione a Modalidade</InputLabel>
                <Select
                  name="modalidade_id"
                  value={formData.modalidade_id}
                  label="Selecione a Modalidade"
                  onChange={handleChange}
                >
                  {modalidades.map(mod => (
                    <MenuItem key={mod.id} value={mod.id}>{mod.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Graduação (Dinâmica) */}
            <Grid xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="600">Graduação Atual</Typography>
              </Box>
              <FormControl fullWidth required disabled={!formData.modalidade_id || loadingGraduacoes}>
                <InputLabel>
                  {loadingGraduacoes ? 'Buscando...' : 'Selecione sua Faixa/Grau'}
                </InputLabel>
                <Select
                  name="graduacao_id"
                  value={formData.graduacao_id}
                  label="Selecione sua Faixa/Grau"
                  onChange={handleChange}
                >
                  {graduacoes.map(grad => (
                    <MenuItem key={grad.id} value={grad.id}>{grad.nome}</MenuItem>
                  ))}
                </Select>
                {!formData.modalidade_id && (
                  <FormHelperText>Selecione uma modalidade primeiro</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid xs={12}><Divider /></Grid>

            {/* Professor */}
            <Grid xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SupervisorAccountIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="600">Responsável Técnico</Typography>
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Selecione seu Professor/Treinador</InputLabel>
                <Select
                  name="professor_id"
                  value={formData.professor_id}
                  label="Selecione seu Professor/Treinador"
                  onChange={handleChange}
                >
                  {professores.map(prof => (
                    <MenuItem key={prof.id} value={prof.id}>{prof.nome || prof.email}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Botão de Ação */}
            <Grid xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting || !formData.graduacao_id}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: 4
                }}
              >
                {submitting ? 'Enviando Solicitação...' : 'Enviar Solicitação de Filiação'}
              </Button>
            </Grid>

          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default FiliacaoPage;
