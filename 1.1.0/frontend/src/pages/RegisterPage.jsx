import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- Importações MUI ---
import {
  Avatar, Button, CssBaseline, TextField, Link, Grid,
  Box, Typography, Container, Alert, InputAdornment,
  IconButton, CircularProgress, Paper, Zoom, FormControlLabel, Checkbox
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [aceitoTermos, setAceitoTermos] = useState(false); // Estado para o checkbox
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Validações Front-end
    if (!email || !senha || !confirmSenha) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (!aceitoTermos) {
      setError("Você precisa aceitar os Termos de Uso e Política de Privacidade.");
      return;
    }

    if (senha !== confirmSenha) {
      setError("As senhas não conferem.");
      return;
    }

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const result = await auth.register(email, senha);

    setLoading(false);

    if (result.success) {
      navigate('/login', { state: { message: "Conta criada com sucesso! Faça seu login." } });
    } else {
      setError(result.message || "Falha no registro. Este e-mail já pode estar em uso.");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ marginTop: 8, marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper 
          elevation={4} 
          sx={{ 
            p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', 
            borderRadius: 3, width: '100%', borderTop: '5px solid', borderColor: 'primary.main' 
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <PersonAddOutlinedIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" fontWeight="bold">
            Criar Conta
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cadastre-se no portal da CONFBEC
          </Typography>

          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required fullWidth id="email" label="E-mail" name="email"
                  autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required fullWidth name="senha" label="Senha"
                  type={showPassword ? 'text' : 'password'} id="senha"
                  autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required fullWidth name="confirmSenha" label="Confirmar Senha"
                  type={showPassword ? 'text' : 'password'} id="confirmSenha"
                  autoComplete="new-password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)}
                  disabled={loading}
                />
              </Grid>

              {/* Checkbox de Termos de Uso */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      value="allowExtraEmails" 
                      color="primary" 
                      checked={aceitoTermos}
                      onChange={(e) => setAceitoTermos(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Eu aceito os <Link href="/termos" target="_blank">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank">Política de Privacidade</Link>.
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            {error && (
              <Zoom in={!!error}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              </Zoom>
            )}

            <Button
              type="submit" fullWidth variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, height: '48px', fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar minha conta'}
            </Button>

            <Grid container justifyContent="center">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                  Já possui uma conta? Acesse aqui
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default RegisterPage;