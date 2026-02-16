import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// --- Importações MUI ---
import {
  Box, Typography, Grid, Paper, CircularProgress, 
  Container, Avatar, Button, Divider, Card, CardContent
} from '@mui/material';

// --- Ícones ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People'; // Atletas/Geral
import DomainIcon from '@mui/icons-material/Domain'; // Academias
import CorporateFareIcon from '@mui/icons-material/CorporateFare'; // Federações
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; // Filiações
import WarningIcon from '@mui/icons-material/Warning'; // Pendências
import NewspaperIcon from '@mui/icons-material/Newspaper'; // Notícias
import PaymentIcon from '@mui/icons-material/Payment';

function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Estados para os contadores ---
  const [stats, setStats] = useState({
    academias: 0,
    federacoes: 0,
    pendentesDocs: 0,
    pendentesProfessor: 0
  });
  const [loading, setLoading] = useState(true);

  // --- Busca Dados do Dashboard ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fazemos várias chamadas em paralelo para preencher os cards
        const [resAcad, resFed, resDocs, resProf] = await Promise.all([
          axios.get('/api/academias'),
          axios.get('/api/federacoes'),
          axios.get('/api/filiacoes/pendentes-docs'), // Rota já existente no backend
          axios.get('/api/filiacoes/pendentes-professor') // Rota já existente
        ]);

        setStats({
          academias: resAcad.data.length,
          federacoes: resFed.data.length,
          pendentesDocs: resDocs.data.length,
          pendentesProfessor: resProf.data.length
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        // Não mostramos erro fatal para não bloquear o admin, apenas logamos
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Componente Interno: Card de Estatística ---
  const StatCard = ({ title, value, icon, color, onClick, subtext }) => (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 6 } : {},
        borderLeft: `5px solid ${color}`
      }}
      onClick={onClick}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56, mr: 2 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {loading ? <CircularProgress size={20} /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="medium">
            {title}
          </Typography>
          {subtext && (
             <Typography variant="caption" color="text.disabled" display="block">
               {subtext}
             </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 2, pb: 4 }}>
      
      {/* 1. Cabeçalho de Boas-vindas */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
          <DashboardIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Olá, {user?.nome?.split(' ')[0] || 'Administrador'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bem-vindo ao painel de controle da <strong>CONFBEC</strong>. Aqui está o resumo de hoje.
          </Typography>
        </Box>
      </Box>

      {/* 2. Cards de Estatísticas (KPIs) */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        
        {/* Card: Pendências de Documentos (O mais urgente) */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Aprovação Pendente"
            subtext="Documentos aguardando análise"
            value={stats.pendentesDocs}
            icon={<WarningIcon />}
            color="#ed6c02" // Laranja Warning
            onClick={() => navigate('/admin/filiacoes-pendentes')}
          />
        </Grid>

        {/* Card: Academias */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Academias"
            value={stats.academias}
            icon={<DomainIcon />}
            color="#0288d1" // Azul Info
            onClick={() => navigate('/admin/academias')}
          />
        </Grid>

        {/* Card: Federações */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Federações"
            value={stats.federacoes}
            icon={<CorporateFareIcon />}
            color="#7b1fa2" // Roxo
            onClick={() => navigate('/admin/federacoes')}
          />
        </Grid>

        {/* Card: Pendência Técnica (Professor) */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Vínculos Técnicos"
            subtext="Aguardando Prof/Treinador"
            value={stats.pendentesProfessor}
            icon={<PeopleIcon />}
            color="#2e7d32" // Verde Success
            // Leva para a mesma tela, mas o filtro lá mostrará
            onClick={() => navigate('/admin/filiacoes-pendentes')} 
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} >
        <Typography color="text.secondary" variant="overline">Acesso Rápido</Typography>
      </Divider>

      {/* 3. Botões de Ação Rápida */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            startIcon={<NewspaperIcon />}
            onClick={() => navigate('/admin/noticias')}
            sx={{ p: 2, justifyContent: 'flex-start' }}
          >
            Publicar Nova Notícia
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            startIcon={<AssignmentIndIcon />}
            onClick={() => navigate('/admin/graduacoes')}
            sx={{ p: 2, justifyContent: 'flex-start' }}
          >
            Gerenciar Graduações
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            startIcon={<PaymentIcon />}
            onClick={() => navigate('/admin/pagamentos')}
            sx={{ p: 2, justifyContent: 'flex-start' }}
          >
            Métodos de Pagamento
          </Button>
        </Grid>
      </Grid>

    </Container>
  );
}

export default AdminDashboardPage;