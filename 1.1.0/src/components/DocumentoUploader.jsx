import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, MenuItem, Select, FormControl, 
  InputLabel, List, ListItem, ListItemText, IconButton, 
  Paper, CircularProgress, Alert, Divider, Tooltip 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function DocumentoUploader({ filiacaoId, onUploadSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('atestado_medico');
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Busca documentos vinculados a esta filiação
  const fetchDocumentos = async () => {
    try {
      const res = await axios.get(`/api/documentos/${filiacaoId}`);
      setDocumentos(res.data);
    } catch (err) {
      console.error("Erro ao buscar documentos", err);
    }
  };

  useEffect(() => {
    if (filiacaoId) fetchDocumentos();
  }, [filiacaoId]);

  // 2. Lógica de Upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Selecione um arquivo primeiro.");
      return;
    }
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('documento', file); // Deve coincidir com o Multer no backend
    formData.append('tipo_documento', tipoDocumento);

    try {
      await axios.post(`/api/documentos/upload/${filiacaoId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      fetchDocumentos();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || "Erro ao enviar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Lógica de Exclusão
  const handleDelete = async (docId) => {
    if (!window.confirm("Deseja excluir este documento?")) return;
    try {
      await axios.delete(`/api/documentos/${docId}`);
      fetchDocumentos();
    } catch (err) {
      setError("Erro ao deletar documento.");
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Documentação da Filiação
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Lista de Documentos já enviados */}
      <List sx={{ mb: 2 }}>
        {documentos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nenhum documento enviado ainda.</Typography>
        ) : (
          documentos.map((doc) => (
            <ListItem 
              key={doc.id}
              divider
              secondaryAction={
                <Box>
                  <Tooltip title="Visualizar">
                    <IconButton edge="end" component="a" href={`/api/uploads/${doc.url_arquivo}`} target="_blank">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {/* Só permite deletar se estiver pendente */}
                  {doc.status === 'pendente' && (
                    <IconButton edge="end" color="error" onClick={() => handleDelete(doc.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              }
            >
              <ListItemText 
                primary={doc.nome_original} 
                secondary={`${doc.tipo_documento.replace(/_/g, ' ')} | Status: ${doc.status.toUpperCase()}`} 
              />
            </ListItem>
          ))
        )}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Formulário de Novo Upload */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Tipo do Documento</InputLabel>
          <Select
            value={tipoDocumento}
            label="Tipo do Documento"
            onChange={(e) => setTipoDocumento(e.target.value)}
          >
            <MenuItem value="atestado_medico">Atestado Médico</MenuItem>
            <MenuItem value="rg_frente">RG (Frente)</MenuItem>
            <MenuItem value="rg_verso">RG (Verso)</MenuItem>
            <MenuItem value="certificado_graduacao">Certificado de Graduação</MenuItem>
            <MenuItem value="comprovante_residencia">Comprovante de Residência</MenuItem>
            <MenuItem value="outro">Outro</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          fullWidth
        >
          {file ? file.name : "Selecionar Arquivo"}
          <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
        </Button>

        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={loading || !file}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Enviando..." : "Enviar para o Servidor"}
        </Button>
      </Box>
    </Paper>
  );
}

export default DocumentoUploader;