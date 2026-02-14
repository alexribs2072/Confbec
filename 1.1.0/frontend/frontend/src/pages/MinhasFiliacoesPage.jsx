import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DocumentoUploader from '../components/DocumentoUploader';
import { formatarDataBR } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// --- Importações MUI ---
import {
  Container, Typography, Card, CardContent, Button, Box,
  CircularProgress, Alert, Divider, Link, Chip, Paper, 
  Grid, Tooltip, Zoom
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

function MinhasFiliacoesPage() {
  const [filiacoes, setFiliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchFiliacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/filiacoes/me');
      setFiliacoes(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Erro ao buscar suas filiações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiliacoes();
  }, [fetchFiliacoes]);

  const handleIrParaPagamento = async (filiacaoId) => {
    setPayingId(filiacaoId);
    try {
      const res = await axios.post(`/api/pagamentos/criar-cobranca/${filiacaoId}`);
      const { pagamentoId } = res.data;
      if (pagamentoId) navigate(`/pagamento/${pagamentoId}`);
    } catch (err) {
      setError(err.response?.data?.msg || "Erro ao iniciar pagamento.");
      setPayingId(null);
    }
  };

  const handleSubmeterDocs = async (filiacaoId) => {
    if (!window.confirm("Enviar documentos para análise? Você não poderá alterá-los até a resposta.")) return;
    setSubmittingId(filiacaoId);
    try {
      await axios.put(`/api/filiacoes/${filiacaoId}/submeter-docs`);
      fetchFiliacoes();
    } catch (err) {
      setError(err.response?.data?.msg || "Erro ao submeter documentos.");
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'ativo': { color: 'success', label: 'Ativo', icon: <CheckCircleIcon size="small"/> },
      'pendente_documentos': { color: 'warning', label: 'Documentação Pendente', icon: <CloudUploadIcon size="small"/> },
      'pendente_aprovacao_docs': { color: 'info', label: 'Em Análise (Documentos)', icon: <InfoIcon size="small"/> },
      'pendente_pagamento': { color: 'success', label: 'Aguardando Pagamento', icon: <PaymentIcon size="small"/> },
      'rejeitado': { color: 'error', label: 'Rejeitado', icon: <ErrorIcon size="small"/> }
    };
    return configs[status] || { color: 'default', label: status.replace(/_/g, ' ').toUpperCase() };
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Carregando suas solicitações...</Typography>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>Minhas Filiações</Typography>
        <Typography variant="body1" color="text.secondary">Acompanhe aqui o status de suas solicitações e pagamentos.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {filiacoes.length === 0 ? (
        <Paper elevation={1} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
          <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>Você ainda não possui filiações.</Typography>
          <Button component={RouterLink} to="/filiacao" variant="contained" sx={{ mt: 2 }}>
            Solicitar Primeira Filiação
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filiacoes.map(filiacao => {
            const statusConfig = getStatusConfig(filiacao.status);
            return (
              <Grid item xs={12} key={filiacao.id}>
                <Card elevation={4} sx={{ borderRadius: 3, borderLeft: 6, borderColor: `${statusConfig.color}.main` }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          {filiacao.modalidade?.nome || 'Modalidade'}
                        </Typography>
                        <Typography variant="subtitle1" color="primary">
                          {filiacao.academia?.nome || 'Academia'}
                        </Typography>
                      </Box>
                      <Chip 
                        icon={statusConfig.icon}
                        label={statusConfig.label} 
                        color={statusConfig.color} 
                        variant="filled" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">PROFESSOR RESPONSÁVEL</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {filiacao.professorResponsavel?.nome || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">DATA DA SOLICITAÇÃO</Typography>
                        <Typography variant="body1">{formatarDataBR(filiacao.data_solicitacao)}</Typography>
                      </Grid>
                    </Grid>

                    {/* Área de Documentos */}
                    {['pendente_documentos', 'pendente_aprovacao_docs', 'rejeitado'].includes(filiacao.status) && (
                      <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <CloudUploadIcon sx={{ mr: 1, fontSize: 20 }} /> Gerenciar Documentos
                        </Typography>
                        <DocumentoUploader filiacaoId={filiacao.id} onUploadSuccess={() => {}} />
                        
                        {filiacao.status === 'pendente_documentos' && (
                          <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Button
                              variant="contained"
                              size="large"
                              onClick={() => handleSubmeterDocs(filiacao.id)}
                              disabled={submittingId === filiacao.id}
                              startIcon={submittingId === filiacao.id ? <CircularProgress size={20} color="inherit"/> : <CheckCircleIcon />}
                            >
                              Finalizar e Enviar para Análise
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    )}

                    {/* Área de Pagamento */}
                    {filiacao.status === 'pendente_pagamento' && (
                      <Zoom in>
                        <Alert 
                          severity="success" 
                          icon={<PaymentIcon />}
                          action={
                            <Button 
                              color="inherit" 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleIrParaPagamento(filiacao.id)}
                              disabled={payingId === filiacao.id}
                            >
                              {payingId === filiacao.id ? 'Gerando...' : 'Pagar Agora'}
                            </Button>
                          }
                        >
                          Sua filiação foi aprovada! Realize o pagamento para ativar.
                        </Alert>
                      </Zoom>
                    )}

                    {filiacao.status === 'rejeitado' && (
                       <Alert severity="error" sx={{ mt: 2 }}>
                          Solicitação Rejeitada. Por favor, revise os documentos enviados ou fale com seu professor.
                       </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}

export default MinhasFiliacoesPage;