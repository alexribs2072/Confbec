import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- 1. IMPORTAÇÃO DA FUNÇÃO DE MOEDA (Mantida) ---
import { formatarValorBR } from '../../utils/currencyUtils'; 

// --- Importações Completas do MUI ---
import {
  Box, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Alert, CircularProgress, Grid, Tooltip,
  Avatar, Zoom, Container, Chip, FormControlLabel, Checkbox, Divider
} from '@mui/material';

// --- Ícones ---
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment'; // Ícone principal
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CodeIcon from '@mui/icons-material/Code'; // Para o campo JSON

function ManagePagamentosPage() {
  // --- Estados ---
  const [metodos, setMetodos] = useState([]);
  const [formData, setFormData] = useState({
    nome: 'PIX',
    taxa_filiacao: '',
    configuracao: '{}',
    ativo: true,
  });
  const [editingId, setEditingId] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Estado de salvamento
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null); // Feedback de sucesso
  const [formError, setFormError] = useState(null);

  // --- Busca de Dados ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/metodos-pagamento');
      setMetodos(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar métodos de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Manipuladores ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    // Validação
    if (!formData.nome || !formData.taxa_filiacao) {
      setFormError("Nome e Taxa são obrigatórios.");
      return;
    }

    // Validação JSON
    let configJson;
    try {
        configJson = JSON.parse(formData.configuracao || '{}');
    } catch (jsonErr) {
        setFormError("O campo Configuração contém um JSON inválido.");
        return;
    }

    const dataToSend = {
      ...formData,
      taxa_filiacao: parseFloat(formData.taxa_filiacao),
      configuracao: configJson,
    };

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(`/api/metodos-pagamento/${editingId}`, dataToSend);
        setSuccessMsg("Método atualizado com sucesso!");
      } else {
        await axios.post('/api/metodos-pagamento', dataToSend);
        setSuccessMsg("Método criado com sucesso!");
      }

      // Reset
      setFormData({ nome: 'PIX', taxa_filiacao: '', configuracao: '{}', ativo: true });
      setEditingId(null);
      fetchData();
      
      // Remove msg após 3s
      setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err) {
      setFormError(err.response?.data?.msg || `Erro ao salvar método.`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (metodo) => {
      setEditingId(metodo.id);
      setFormData({
          nome: metodo.nome,
          taxa_filiacao: metodo.taxa_filiacao.toString(),
          configuracao: JSON.stringify(metodo.configuracao || {}, null, 2),
          ativo: metodo.ativo
      });
      setFormError(null);
      setSuccessMsg(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setFormData({ nome: 'PIX', taxa_filiacao: '', configuracao: '{}', ativo: true });
      setFormError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Atenção: Deletar este método pode quebrar registros de pagamentos antigos. Deseja continuar?")) return;
    try {
      await axios.delete(`/api/metodos-pagamento/${id}`);
      setSuccessMsg("Método removido.");
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
       setError(err.response?.data?.msg || 'Erro ao deletar método.');
    }
  };

  return (
    <Container maxWidth="lg">
      
      {/* --- 1. CABEÇALHO --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Avatar Verde para Dinheiro/Pagamento */}
        <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56, boxShadow: 3 }}>
          <PaymentIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Métodos de Pagamento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure taxas, chaves PIX e integrações de pagamento.
          </Typography>
        </Box>
      </Box>

      {/* --- FEEDBACK --- */}
      <Box sx={{ mb: 2, height: 50 }}>
        {successMsg && <Zoom in><Alert severity="success">{successMsg}</Alert></Zoom>}
        {error && <Zoom in><Alert severity="error">{error}</Alert></Zoom>}
      </Box>

      {/* --- 2. CARD DE FORMULÁRIO --- */}
      <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, borderLeft: '6px solid #2e7d32' }}> {/* Borda Verde */}
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          {editingId ? <EditIcon color="secondary" /> : <PaymentIcon color="success" />}
          {editingId ? `Editando Método #${editingId}` : 'Novo Método de Pagamento'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Linha 1: Nome e Taxa */}
            <Grid item xs={12} md={6}>
              <TextField
                name="nome"
                label="Nome do Método"
                placeholder="Ex: PIX, Cartão de Crédito"
                variant="outlined"
                fullWidth
                required
                value={formData.nome}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="taxa_filiacao"
                label="Taxa de Filiação (R$)"
                placeholder="0.00"
                type="number"
                InputProps={{ inputProps: { step: "0.01", min: "0" } }} 
                variant="outlined"
                fullWidth
                required
                value={formData.taxa_filiacao}
                onChange={handleChange}
                disabled={saving}
                helperText="Use ponto para centavos"
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
               <FormControlLabel
                control={
                  <Checkbox
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                    color="success"
                  />
                }
                label={<Typography fontWeight="bold" color={formData.ativo ? 'success.main' : 'text.disabled'}>Método Ativo</Typography>}
              />
            </Grid>

            {/* Linha 2: Configuração JSON */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CodeIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                    Configuração Técnica (JSON)
                </Typography>
              </Box>
              <TextField
                name="configuracao"
                multiline
                rows={5}
                variant="outlined"
                fullWidth
                value={formData.configuracao}
                onChange={handleChange}
                placeholder={`{
  "provider": "cora",
  "payment_forms": ["BANK_SLIP", "PIX"],
  "dueDays": 1
}`}

                disabled={saving}
                // Fonte Monoespaçada para código
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: '#fafafa' } }}
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color={editingId ? "secondary" : "success"}
                size="large"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
                sx={{ minWidth: 150, fontWeight: 'bold' }}
              >
                {saving ? 'Salvando...' : (editingId ? 'Atualizar' : 'Salvar Método')}
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
        <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon sx={{ color: 'white' }} />
          <Typography variant="h6" color="white" fontWeight="bold">
            Métodos Cadastrados
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Taxa</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Configuração (JSON)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : metodos.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhum método encontrado.</TableCell></TableRow>
              ) : (
                metodos.map((met) => (
                  <TableRow key={met.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{met.nome}</TableCell>
                    <TableCell>
                        <Chip label={formatarValorBR(met.taxa_filiacao)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                        {/* Exibição formatada do JSON */}
                        <Box sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem', 
                            bgcolor: 'grey.50', 
                            p: 1, 
                            borderRadius: 1, 
                            border: '1px solid #eee',
                            maxWidth: '300px',
                            overflowX: 'auto'
                        }}>
                            {JSON.stringify(met.configuracao, null, 1).replace(/[{}]/g, '').trim()}
                        </Box>
                    </TableCell>
                    <TableCell align="center">
                        <Chip 
                            label={met.ativo ? "Ativo" : "Inativo"} 
                            color={met.ativo ? "success" : "default"}
                            size="small"
                        />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleEdit(met)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton onClick={() => handleDelete(met.id)} color="error" size="small" sx={{ bgcolor: 'error.50' }}>
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
        
        {!loading && metodos.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'right', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">Total: {metodos.length}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default ManagePagamentosPage;