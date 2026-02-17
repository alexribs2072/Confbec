import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  Box, CssBaseline, AppBar, Toolbar, IconButton, 
  Typography, Drawer, Tooltip, Avatar 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import UnifiedSidebar from '../components/UnifiedSidebar'; // O componente que criamos antes
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barra Superior Fixa */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            CONFBEC - Sistema
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
              Olá, <strong>{user?.nome}</strong>
            </Typography>
            <Tooltip title="Sair">
              <IconButton onClick={handleLogout} color="error" size="small">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navegação Lateral (Sidebar) */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <UnifiedSidebar onCloseMobile={handleDrawerToggle} />
        </Drawer>

        {/* Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <UnifiedSidebar onCloseMobile={() => {}} />
        </Drawer>
      </Box>

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#f4f6f8',
        }}
      >
        <Toolbar /> {/* Espaçador para não ficar atrás do AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;