import React, { useState } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu,
  Container, Button, MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user } = useAuth();
  const [anchorElNav, setAnchorElNav] = useState(null);

  // Define para onde o botão "Meu Perfil" vai levar
  const dashboardPath = user?.tipo === 'admin' ? '/admin' : '/perfil-atleta';
  
  // CORREÇÃO AQUI: Garante que temos um nome ou usa "Usuário" como padrão
  const primeiroNome = user?.nome ? user.nome.split(' ')[0] : 'Usuário';

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const pages = [
    { title: 'Início', path: '/' },
    { title: 'Competições', path: '/competicoes' }
  ];

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* LOGO (Desktop) */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 800,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            CONFBEC
          </Typography>

          {/* MENU MOBILE */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem 
                  key={page.title} 
                  component={RouterLink} 
                  to={page.path} 
                  onClick={handleCloseNavMenu}
                >
                  <Typography textAlign="center">{page.title}</Typography>
                </MenuItem>
              ))}

              {user ? (
                <MenuItem component={RouterLink} to={dashboardPath} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center" fontWeight="bold" color="primary">Meu Perfil</Typography>
                </MenuItem>
              ) : (
                [
                  <MenuItem key="login" component={RouterLink} to="/login" onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">Login</Typography>
                  </MenuItem>,
                  <MenuItem key="register" component={RouterLink} to="/register" onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">Registrar</Typography>
                  </MenuItem>
                ]
              )}
            </Menu>
          </Box>

          {/* LOGO (Mobile) */}
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 800,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            CONFBEC
          </Typography>

          {/* MENU DESKTOP */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 2 }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                component={RouterLink}
                to={page.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block', fontWeight: 500 }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          {/* BOTOES DE AÇÃO */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
            {user ? (
              <Button
                component={RouterLink}
                to={dashboardPath}
                variant="contained"
                color="secondary"
                startIcon={<DashboardIcon />}
                sx={{ 
                  fontWeight: 'bold',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3
                }}
              >
                Olá, {primeiroNome} | Meu Perfil
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  color="inherit"
                  startIcon={<LoginIcon />}
                  sx={{ borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="secondary"
                  startIcon={<AppRegistrationIcon />}
                  sx={{ fontWeight: 'bold' }}
                >
                  Registrar
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;