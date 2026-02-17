import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// Este componente agora atua como Layout PÚBLICO
// Usado para Home, Login, Registro e visualização pública de eventos
function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3, px: 2, mt: 'auto',
          bgcolor: 'background.paper',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CONFBEC - Confederação Brasileira de Esportes de Combate.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App;