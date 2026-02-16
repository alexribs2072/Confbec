import React from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Navbar from './Navbar'; // Certifique-se que o caminho está correto

const MainLayout = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        bgcolor: 'background.default' 
      }}
    >
      {/* Barra de Navegação Superior presente em todas as páginas comuns */}
      <Navbar />

      {/* Conteúdo Dinâmico: Aqui entram as páginas como Home, Perfil, etc. */}
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          <Outlet /> 
        </Container>
      </Box>

      {/* Rodapé Institucional fixo no final */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: (theme) => theme.palette.grey[200],
          borderTop: '1px solid #e0e0e0' 
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
};

export default MainLayout;