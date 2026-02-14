import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Divider,
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

  const navItems = useMemo(
    () => [
      { key: 'home', label: 'Início', to: '/', show: true },
      { key: 'filiacao', label: 'Nova Filiação', to: '/filiacao', show: isAtleta },
      { key: 'minhas', label: 'Minhas Filiações', to: '/minhas-filiacoes', show: isAtleta },
      {
        key: 'aprovacoes',
        label: 'Central de Aprovações',
        mobileLabel: 'Aprovações',
        to: '/admin/filiacoes-pendentes',
        show: isAdmin || isProfessor,
        desktopButton: {
          variant: 'contained',
          color: 'secondary',
          sx: { my: 2, ml: 2, fontWeight: 'bold' },
        },
      },
    ],
    [isAtleta, isAdmin, isProfessor]
  );

  const visibleNavItems = navItems.filter((i) => i.show);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await Promise.resolve(logout?.());
    } finally {
      navigate('/login');
    }
  };

  const handleUserNavigate = (path) => {
    handleCloseUserMenu();
    navigate(path);
  };

  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'primary.main' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* LOGO / BRAND (DESKTOP) */}
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
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {visibleNavItems.map((item) => (
                <MenuItem
                  key={item.key}
                  onClick={handleCloseNavMenu}
                  component={RouterLink}
                  to={item.to}
                >
                  {item.mobileLabel || item.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* LOGO / BRAND (MOBILE) */}
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
            {visibleNavItems.map((item) => {
              const desktopBtn = item.desktopButton || {};
              const variant = desktopBtn.variant || 'text';
              const color = desktopBtn.color || 'inherit';

              return (
                <Button
                  key={item.key}
                  component={RouterLink}
                  to={item.to}
                  variant={variant}
                  color={color}
                  sx={{
                    my: 2,
                    ...(variant === 'contained' ? {} : { color: 'white' }),
                    ...(desktopBtn.sx || {}),
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* MENU DE USUÁRIO (AVATAR) */}
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
                      {user?.nome || 'Atleta'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Link para o Painel Administrativo Completo (Apenas Admin) */}
                  {isAdmin && (
                    <MenuItem onClick={() => handleUserNavigate('/admin')}>
                      <DashboardIcon sx={{ mr: 1, fontSize: 'small' }} /> Painel Admin
                    </MenuItem>
                  )}

                  <MenuItem onClick={() => handleUserNavigate('/perfil-atleta')}>
                    Meu Perfil
                  </MenuItem>

                  <Divider />

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
