import React, { useState } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu,
  Container, Avatar, Button, Tooltip, MenuItem, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const isAdmin = user?.tipo === 'admin';
  const isProfessor = user?.tipo === 'professor' || user?.tipo === 'treinador';
  const isAtleta = user?.tipo === 'atleta';

  const profileRoute = isAtleta ? '/perfil-atleta' : '/perfil-usuario';

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const safeNavigate = (path) => {
    handleCloseNavMenu();
    handleCloseUserMenu();
    navigate(path);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await Promise.resolve(logout?.());
    } finally {
      navigate('/login');
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'primary.main',
        top: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
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
              aria-label="Abrir menu de navegação"
              aria-controls={anchorElNav ? 'menu-nav' : undefined}
              aria-haspopup="true"
            >
              <MenuIcon />
            </IconButton>

            <Menu
              id="menu-nav"
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              keepMounted
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuItem onClick={() => safeNavigate('/')}>Início</MenuItem>

              <MenuItem onClick={() => safeNavigate('/competicoes')}>Competições</MenuItem>

              {isAtleta && (
                <>
                  <MenuItem onClick={() => safeNavigate('/filiacao')}>Nova Filiação</MenuItem>
                  <MenuItem onClick={() => safeNavigate('/minhas-filiacoes')}>Minhas Filiações</MenuItem>
                  <MenuItem onClick={() => safeNavigate('/competicoes/minhas-inscricoes')}>Minhas Inscrições</MenuItem>
                </>
              )}

              {(isAdmin || isProfessor) && (
                <MenuItem onClick={() => safeNavigate('/admin/filiacoes-pendentes')}>
                  Aprovações
                </MenuItem>
              )}
            </Menu>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              fontWeight: 800,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            CONFBEC
          </Typography>

          {/* MENU DESKTOP */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 2 }}>
            <Button component={RouterLink} to="/" sx={{ my: 2, color: 'white' }}>
              Início
            </Button>

            <Button component={RouterLink} to="/competicoes" sx={{ my: 2, color: 'white' }}>
              Competições
            </Button>

            {isAtleta && (
              <>
                <Button component={RouterLink} to="/filiacao" sx={{ my: 2, color: 'white' }}>
                  Nova Filiação
                </Button>
                <Button component={RouterLink} to="/minhas-filiacoes" sx={{ my: 2, color: 'white' }}>
                  Minhas Filiações
                </Button>
                <Button component={RouterLink} to="/competicoes/minhas-inscricoes" sx={{ my: 2, color: 'white' }}>
                  Minhas Inscrições
                </Button>
              </>
            )}

            {(isAdmin || isProfessor) && (
              <Button
                component={RouterLink}
                to="/admin/filiacoes-pendentes"
                variant="contained"
                color="secondary"
                sx={{ my: 2, ml: 2, fontWeight: 'bold' }}
              >
                Central de Aprovações
              </Button>
            )}
          </Box>

          {/* MENU DE USUÁRIO */}
          <Box sx={{ flexGrow: 0 }}>
            {user ? (
              <>
                <Tooltip title="Abrir menu">
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{ p: 0 }}
                    aria-label="Abrir menu do usuário"
                    aria-controls={anchorElUser ? 'menu-user' : undefined}
                    aria-haspopup="true"
                  >
                    <Avatar alt={user?.nome || 'Usuário'} sx={{ bgcolor: 'secondary.main' }}>
                      {user?.nome ? user.nome.charAt(0).toUpperCase() : <AccountCircleIcon />}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  id="menu-user"
                  sx={{ mt: '45px' }}
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  keepMounted
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user?.nome || 'Usuário'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>

                  <Divider />

                  {isAdmin && (
                    <MenuItem onClick={() => safeNavigate('/admin')}>
                      <DashboardIcon sx={{ mr: 1, fontSize: 'small' }} /> Painel Admin
                    </MenuItem>
                  )}

                  <MenuItem onClick={() => safeNavigate(profileRoute)}>
                    Meu Perfil
                  </MenuItem>

                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    Sair
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button component={RouterLink} to="/login" color="inherit" variant="outlined">
                  Login
                </Button>
                <Button component={RouterLink} to="/register" color="secondary" variant="contained">
                  Registrar
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
