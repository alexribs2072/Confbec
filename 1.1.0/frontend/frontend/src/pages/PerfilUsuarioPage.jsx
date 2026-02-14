import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material';

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

export default function PerfilUsuarioPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [tipo, setTipo] = React.useState('');

  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const fetchMe = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      const res = await fetch('/api/usuarios/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erro ao buscar perfil (${res.status})`);
      }

      const data = await res.json();
      setNome(data?.nome || '');
      setEmail(data?.email || '');
      setTipo(data?.tipo || '');
    } catch (e) {
      setError(e.message || 'Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      const res = await fetch('/api/usuarios/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nome, email }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erro ao salvar (${res.status})`);
      }

      setSuccess('Perfil atualizado com sucesso.');
    } catch (e) {
      setError(e.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Meu Perfil
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            fullWidth
            disabled={loading || saving}
          />

          <TextField
            label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            disabled={loading || saving}
          />

          <TextField
            label="Tipo"
            value={tipo}
            fullWidth
            disabled
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>

            <Button
              variant="outlined"
              onClick={fetchMe}
              disabled={loading || saving}
            >
              Recarregar
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
