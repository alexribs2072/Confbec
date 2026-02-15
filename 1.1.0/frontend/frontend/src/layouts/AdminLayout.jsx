import React from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- Importações do MUI ---
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar'; // Importado Avatar

// Ícones
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import StoreIcon from '@mui/icons-material/Store';
import PaymentIcon from '@mui/icons-material/Payment';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person'; // Ícone genérico para avatar

const drawerWidth = 260; // Aumentei um pouco para melhor leitura

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber a rota atual

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Função auxiliar para verificar se a rota está ativa
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Estilo personalizado para os botões do menu
  const menuButtonStyle = (path) => ({
    mb: 1, // Espaçamento entre botões
    borderRadius: 2, // Cantos arredondados
    mx: 1, // Margem lateral
    // Estilo quando ativo
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'white',
      '&:hover': {
        bgcolor: 'primary.dark',
      },
      '& .MuiListItemIcon-root': {
        color: 'white',
      },
    },
    // Estilo hover normal
    '&:hover': {
      bgcolor: 'action.hover',
    },
  });

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* 1. CABEÇALHO DO MENU (Perfil) */}
      <Box 
        sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #003366 0%, #005599 100%)', // Gradiente Azul
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 1
        }}
      >
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            mb: 2, 
            bgcolor: 'white', 
            color: 'primary.main',
            boxShadow: 3
          }}
        >
          {user?.nome ? user.nome.charAt(0).toUpperCase() : <PersonIcon />}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {user ? user.nome : 'Administrador'}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {user ? user.email : 'Carregando...'}
        </Typography>
      </Box>

      {/* 2. LISTA DE NAVEGAÇÃO */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List>
          <Typography variant="overline" sx={{ px: 3, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', fontSize: '0.7rem' }}>
              Painel de Controle
          </Typography>
          
          <ListItem disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to="/admin"
              selected={isActive('/admin')}
              sx={menuButtonStyle('/admin')}
            >
              <ListItemIcon sx={{ color: isActive('/admin') ? 'white' : 'inherit' }}> <DashboardIcon /> </ListItemIcon>
              <ListItemText primary="Visão Geral" />
            </ListItemButton>
          </ListItem>

          <Typography variant="overline" sx={{ px: 3, mt: 2, mb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', fontSize: '0.7rem' }}>
              Gestão Esportiva
          </Typography>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/modalidades" selected={isActive('/admin/modalidades')} sx={menuButtonStyle('/admin/modalidades')}>
              <ListItemIcon sx={{ color: isActive('/admin/modalidades') ? 'white' : 'inherit' }}> <CategoryIcon /> </ListItemIcon>
              <ListItemText primary="Modalidades" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/graduacoes" selected={isActive('/admin/graduacoes')} sx={menuButtonStyle('/admin/graduacoes')}>
              <ListItemIcon sx={{ color: isActive('/admin/graduacoes') ? 'white' : 'inherit' }}> <StarIcon /> </ListItemIcon>
              <ListItemText primary="Graduações" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/competicoes" selected={isActive('/admin/competicoes')} sx={menuButtonStyle('/admin/competicoes')}>
              <ListItemIcon sx={{ color: isActive('/admin/competicoes') ? 'white' : 'inherit' }}> <EmojiEventsIcon /> </ListItemIcon>
              <ListItemText primary="Competições" />
            </ListItemButton>
          </ListItem>

          <Typography variant="overline" sx={{ px: 3, mt: 2, mb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', fontSize: '0.7rem' }}>
              Institucional
          </Typography>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/federacoes" selected={isActive('/admin/federacoes')} sx={menuButtonStyle('/admin/federacoes')}>
              <ListItemIcon sx={{ color: isActive('/admin/federacoes') ? 'white' : 'inherit' }}> <CorporateFareIcon /> </ListItemIcon>
              <ListItemText primary="Federações" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/academias" selected={isActive('/admin/academias')} sx={menuButtonStyle('/admin/academias')}>
              <ListItemIcon sx={{ color: isActive('/admin/academias') ? 'white' : 'inherit' }}> <StoreIcon /> </ListItemIcon>
              <ListItemText primary="Academias" />
            </ListItemButton>
          </ListItem>

          <Typography variant="overline" sx={{ px: 3, mt: 2, mb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', fontSize: '0.7rem' }}>
              Sistema
          </Typography>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/pagamentos" selected={isActive('/admin/pagamentos')} sx={menuButtonStyle('/admin/pagamentos')}>
              <ListItemIcon sx={{ color: isActive('/admin/pagamentos') ? 'white' : 'inherit' }}> <PaymentIcon /> </ListItemIcon>
              <ListItemText primary="Financeiro" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/noticias" selected={isActive('/admin/noticias')} sx={menuButtonStyle('/admin/noticias')}>
              <ListItemIcon sx={{ color: isActive('/admin/noticias') ? 'white' : 'inherit' }}> <NewspaperIcon /> </ListItemIcon>
              <ListItemText primary="Notícias" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* 3. RODAPÉ DO MENU (Ações de Saída) */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to="/" 
              sx={{ borderRadius: 2, '&:hover': { bgcolor: 'grey.200' } }}
            >
              <ListItemIcon> <HomeIcon /> </ListItemIcon>
              <ListItemText primary="Voltar ao Site" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton 
              onClick={handleLogout} 
              sx={{ 
                borderRadius: 2, 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.50' },
                '& .MuiListItemIcon-root': { color: 'error.main' }
              }}
            >
              <ListItemIcon> <ExitToAppIcon /> </ListItemIcon>
              <ListItemText primary="Sair do Sistema" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0', // Borda sutil
            bgcolor: '#ffffff'
          },
        }}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f4f6f8', minHeight: '100vh', p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;