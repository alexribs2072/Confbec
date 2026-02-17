import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  Box, List, ListItem, ListItemButton, ListItemIcon, 
  ListItemText, Typography, Divider, Avatar 
} from '@mui/material';
import { MENU_STRUCTURE } from '../config/menuConfig';
import { useAuth } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';

const UnifiedSidebar = ({ onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* CABEÇALHO DO SIDEBAR (Perfil Rápido) */}
      <Box 
        sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #003366 0%, #005599 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <Avatar 
          sx={{ width: 64, height: 64, mb: 1.5, bgcolor: 'white', color: 'primary.main', boxShadow: 2 }}
        >
          {user.nome ? user.nome.charAt(0).toUpperCase() : <PersonIcon />}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: '100%' }}>
          {user.nome || 'Usuário'}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
          {user.tipo}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {MENU_STRUCTURE.map((section, index) => {
          // Filtra itens que o usuário tem permissão para ver
          const authorizedItems = section.items.filter(item => 
            item.allowedRoles.includes(user.tipo)
          );

          if (authorizedItems.length === 0) return null;

          return (
            <React.Fragment key={index}>
              {section.header && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    px: 3, mt: 2, mb: 0.5, display: 'block', 
                    color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase' 
                  }}
                >
                  {section.header}
                </Typography>
              )}
              
              <List disablePadding>
                {authorizedItems.map((item) => (
                  <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                    <ListItemButton
                      component={RouterLink}
                      to={item.path}
                      onClick={onCloseMobile} // Fecha o menu no mobile ao clicar
                      selected={isActive(item.path)}
                      sx={{
                        borderRadius: 2,
                        minHeight: 44,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' },
                          '& .MuiListItemIcon-root': { color: 'white' },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'white' : 'text.secondary' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive(item.path) ? 600 : 400 }} 
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1, opacity: 0.5 }} />
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

export default UnifiedSidebar;