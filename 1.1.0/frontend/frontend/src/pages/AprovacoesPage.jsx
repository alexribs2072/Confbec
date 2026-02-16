import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { formatarDataBR } from '../utils/dateUtils';

// --- Importações MUI ---
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, CircularProgress, Button,
  Tabs, Tab, Chip, Avatar, Tooltip, Divider
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function AprovacoesPage() {
  const { user } = useAuth();
  const [filiacoesDocs, setFiliacoesDocs] = useState([]); // Apenas para Admin
  const [filiacoesProf, setFiliacoesProf] = useState([]); // Para Professor e Admin
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchPendencias = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      
      const isAdmin = user.tipo === 'admin';
      const isProfessor = user.tipo === 'professor' || user.tipo === 'treinador';

      if (isAdmin) {
        // Admin faz chamadas separadas para popular ambas as listas
        const [resDocs, resProf] = await Promise.all([
          axios.get('/api/filiacoes/pendentes-docs'),
          axios.get('/api/filiacoes/pendentes-professor')
        ]);
        setFiliacoesDocs(resDocs.data || []);
        setFiliacoesProf(resProf.data || []);
      } else if (isProfessor) {
        // Professor busca apenas o que depende da sua aprovação técnica
        const resProf = await axios.get('/api/filiacoes/pendentes-professor');
        setFiliacoesProf(resProf.data || []);
        setFiliacoesDocs([]); // Garante lista vazia para não dar erro de render
      }

    } catch (err) {
      console.error("Erro ao carregar aprovações:", err);
      setError('Não foi possível carregar as pendências. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPendencias(); }, [fetchPendencias]);

  const renderTabela = (lista, tipoLista) => (
    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: 'primary.main' }}>
          <TableRow>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Atleta</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Academia</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modalidade</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Solicitado Em</TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Ação</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lista.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <Typography color="text.secondary">
                  Nenhuma pendência de {tipoLista === 'docs' ? 'documentos' : 'vínculo técnico'} encontrada.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            lista.map((f) => (
              <TableRow key={f.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', border: '2px solid #fff' }}>
                      {f.atleta?.nome_completo?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">{f.atleta?.nome_completo}</Typography>
                      <Typography variant="caption" color="text.secondary">CPF: {f.atleta?.cpf}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{f.academia?.nome}</TableCell>
                <TableCell>
                  <Chip label={f.modalidade?.nome} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{formatarDataBR(f.data_solicitacao)}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    component={RouterLink}
                    to={`/admin/aprovacao/${f.id}`}
                    sx={{ borderRadius: 2 }}
                  >
                    Analisar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  const isAdmin = user?.tipo === 'admin';

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Central de Aprovações
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Logado como: <strong>{user?.nome || user?.email}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isAdmin ? (
        <Box>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<AssignmentIndIcon />} iconPosition="start" label={`Docs Pendentes (${filiacoesDocs.length})`} />
            <Tab icon={<VerifiedUserIcon />} iconPosition="start" label={`Vínculos Técnicos (${filiacoesProf.length})`} />
          </Tabs>
          {tabValue === 0 && renderTabela(filiacoesDocs, 'docs')}
          {tabValue === 1 && renderTabela(filiacoesProf, 'vinculo')}
        </Box>
      ) : (
        // Se for Professor, renderiza direto a tabela de vínculos sem abas
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserIcon color="primary" /> Vínculos de Atletas para Validar
          </Typography>
          {renderTabela(filiacoesProf, 'vinculo')}
        </Box>
      )}
    </Box>
  );
}

export default AprovacoesPage;