import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navbar Superior */}
      <Navbar />

      {/* Área de Conteúdo (Onde as páginas filhas do main.jsx serão renderizadas) */}
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      {/* Rodapé (theme-aware: funciona bem no dark mode) */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
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
