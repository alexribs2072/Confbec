import React from 'react'; // Importante para o JSX funcionar
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CategoryIcon from '@mui/icons-material/Category';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PaymentIcon from '@mui/icons-material/Payment';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // Novo ícone para Perfil

// Definição de Permissões
const ROLES = {
  ADMIN: 'admin',
  PROFESSOR: 'professor',
  TREINADOR: 'treinador',
  ATLETA: 'atleta',
};

export const MENU_STRUCTURE = [
  // --- SEÇÃO DE CONTA (Para Todos) ---
  {
    header: 'Minha Conta',
    items: [
      {
        title: 'Meu Perfil',
        path: '/perfil-atleta', // Rota do Atleta
        icon: <AccountBoxIcon />,
        allowedRoles: [ROLES.ATLETA],
      },
      {
        title: 'Meu Perfil',
        path: '/perfil-usuario', // Rota para Admin/Prof (Precisa existir no main.jsx)
        icon: <AccountBoxIcon />,
        allowedRoles: [ROLES.ADMIN, ROLES.PROFESSOR, ROLES.TREINADOR],
      }
    ]
  },

  // --- SEÇÃO GERAL ---
  {
    header: 'Principal',
    items: [
      {
        title: 'Início',
        path: '/', // Home pública (ou dashboard se preferir mudar)
        icon: <DashboardIcon />,
        allowedRoles: Object.values(ROLES),
      },
      {
        title: 'Competições',
        path: '/competicoes',
        icon: <EmojiEventsIcon />,
        allowedRoles: Object.values(ROLES),
      },
    ]
  },

  // --- ÁREA DO ATLETA ---
  {
    header: 'Área do Atleta',
    items: [
      {
        title: 'Nova Filiação',
        path: '/filiacao',
        icon: <AssignmentIndIcon />,
        allowedRoles: [ROLES.ATLETA],
      },
      {
        title: 'Minhas Filiações',
        path: '/minhas-filiacoes',
        icon: <HistoryEduIcon />,
        allowedRoles: [ROLES.ATLETA],
      },
      {
        title: 'Minhas Inscrições',
        path: '/competicoes/minhas-inscricoes',
        icon: <EmojiEventsIcon />,
        allowedRoles: [ROLES.ATLETA],
      },
      {
        title: 'Carrinho',
        path: '/competicoes/carrinho',
        icon: <PaymentIcon />, // Reutilizando ícone de pagamento
        allowedRoles: [ROLES.ATLETA],
      },
    ]
  },

  // --- GESTÃO (Professores e Admins) ---
  {
    header: 'Gestão',
    items: [
      {
        title: 'Aprovações Pendentes',
        path: '/admin/filiacoes-pendentes',
        icon: <DoneAllIcon />,
        allowedRoles: [ROLES.ADMIN, ROLES.PROFESSOR, ROLES.TREINADOR],
      },
    ]
  },

  // --- ADMINISTRAÇÃO AVANÇADA (Apenas Admin) ---
  {
    header: 'Administração',
    items: [
      {
        title: 'Painel Admin',
        path: '/admin',
        icon: <DashboardIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Modalidades',
        path: '/admin/modalidades',
        icon: <CategoryIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Submodalidades',
        path: '/admin/submodalidades',
        icon: <SportsMartialArtsIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Graduações',
        path: '/admin/graduacoes',
        icon: <SportsMartialArtsIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Federações',
        path: '/admin/federacoes',
        icon: <CorporateFareIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Academias',
        path: '/admin/academias',
        icon: <CorporateFareIcon />, // Ícone de prédio/academia
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Financeiro',
        path: '/admin/pagamentos',
        icon: <PaymentIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        title: 'Notícias',
        path: '/admin/noticias',
        icon: <NewspaperIcon />,
        allowedRoles: [ROLES.ADMIN],
      },
    ]
  }
];