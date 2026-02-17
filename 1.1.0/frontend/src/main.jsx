import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// MUI e Contextos
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import theme from './theme';
import { AuthProvider } from './context/AuthContext.jsx';

// Guardas de Rota
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ProfessorAdminRoute from './components/ProfessorAdminRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// Layouts
import App from './App.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Páginas Públicas
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Páginas de Usuário/Atleta
import PerfilAtletaPage from './pages/PerfilAtletaPage.jsx';
import FiliacaoPage from './pages/FiliacaoPage.jsx';
import MinhasFiliacoesPage from './pages/MinhasFiliacoesPage.jsx';
import PagamentoPage from './pages/PagamentoPage.jsx';

// Competições
import CompeticoesPage from './pages/CompeticoesPage.jsx';
import CompeticaoDetalhePage from './pages/CompeticaoDetalhePage.jsx';
import MinhasInscricoesCompeticaoPage from './pages/MinhasInscricoesCompeticaoPage.jsx';
import CompeticaoInscricaoDetalhePage from './pages/CompeticaoInscricaoDetalhePage.jsx';
import CompeticoesCarrinhoPage from './pages/CompeticoesCarrinhoPage.jsx';

// Páginas de Gestão
import AprovacoesPage from './pages/AprovacoesPage.jsx';
import AprovacaoDetalhePage from './pages/AprovacaoDetalhePage.jsx';

// Páginas Admin
import ManageAcademiasPage from './pages/admin/ManageAcademiasPage.jsx';
import ManageFederacoesPage from './pages/admin/ManageFederacoesPage.jsx';
import ManageModalidadesPage from './pages/admin/ManageModalidadesPage.jsx';
import ManageGraduacoesPage from './pages/admin/ManageGraduacoesPage.jsx';
import ManageNoticiasPage from './pages/admin/ManageNoticiasPage.jsx';
import ManagePagamentosPage from './pages/admin/ManagePagamentosPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import ManageCompeticoesPage from './pages/admin/ManageCompeticoesPage.jsx';
import ManageSubmodalidadesPage from './pages/admin/ManageSubmodalidadesPage.jsx';

const router = createBrowserRouter([
  // 1. ÁREA PÚBLICA
  {
    path: '/',
    element: <App />, 
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'competicoes', element: <CompeticoesPage /> },
      { path: 'competicoes/:eventoId', element: <CompeticaoDetalhePage /> },
    ],
  },

  // 2. ÁREA LOGADA
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      // --- PERFIL GERAL (CORREÇÃO AQUI) ---
      // Esta linha conserta o erro. Redirecionamos o /perfil-usuario para a página de perfil existente
      { path: 'perfil-usuario', element: <PerfilAtletaPage /> }, 
      { path: 'perfil-atleta', element: <PerfilAtletaPage /> },

      // --- ATLETA ---
      { path: 'filiacao', element: <FiliacaoPage /> },
      { path: 'minhas-filiacoes', element: <MinhasFiliacoesPage /> },
      { path: 'competicoes/minhas-inscricoes', element: <MinhasInscricoesCompeticaoPage /> },
      { path: 'competicoes/carrinho', element: <CompeticoesCarrinhoPage /> },
      { path: 'competicoes/inscricoes/:inscricaoId', element: <CompeticaoInscricaoDetalhePage /> },
      { path: 'pagamento/:pagamentoId', element: <PagamentoPage /> },

      // --- GESTÃO (Professor / Admin) ---
      { 
        path: 'admin/filiacoes-pendentes', 
        element: <ProfessorAdminRoute><AprovacoesPage /></ProfessorAdminRoute> 
      },
      { 
        path: 'admin/aprovacao/:filiacaoId', 
        element: <ProfessorAdminRoute><AprovacaoDetalhePage /></ProfessorAdminRoute> 
      },

      // --- ADMINISTRAÇÃO ---
      { path: 'admin', element: <AdminRoute><AdminDashboardPage /></AdminRoute> },
      { path: 'admin/modalidades', element: <AdminRoute><ManageModalidadesPage /></AdminRoute> },
      { path: 'admin/submodalidades', element: <AdminRoute><ManageSubmodalidadesPage /></AdminRoute> },
      { path: 'admin/competicoes', element: <AdminRoute><ManageCompeticoesPage /></AdminRoute> },
      { path: 'admin/graduacoes', element: <AdminRoute><ManageGraduacoesPage /></AdminRoute> },
      { path: 'admin/federacoes', element: <AdminRoute><ManageFederacoesPage /></AdminRoute> },
      { path: 'admin/academias', element: <AdminRoute><ManageAcademiasPage /></AdminRoute> },
      { path: 'admin/noticias', element: <AdminRoute><ManageNoticiasPage /></AdminRoute> },
      { path: 'admin/pagamentos', element: <AdminRoute><ManagePagamentosPage /></AdminRoute> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </React.StrictMode>
);