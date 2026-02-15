import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// MUI e Localização
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

// Layouts e Páginas Gerais
import App from './App.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Páginas de Atleta
import PerfilAtletaPage from './pages/PerfilAtletaPage.jsx';
import FiliacaoPage from './pages/FiliacaoPage.jsx';
import MinhasFiliacoesPage from './pages/MinhasFiliacoesPage.jsx';
import PagamentoPage from './pages/PagamentoPage.jsx';

// Competições
import CompeticoesPage from './pages/CompeticoesPage.jsx';
import CompeticaoDetalhePage from './pages/CompeticaoDetalhePage.jsx';
import MinhasInscricoesCompeticaoPage from './pages/MinhasInscricoesCompeticaoPage.jsx';

// Páginas de Gestão (Professor/Admin)
import AprovacoesPage from './pages/AprovacoesPage.jsx';
import AprovacaoDetalhePage from './pages/AprovacaoDetalhePage.jsx';

// Admin
import ManageAcademiasPage from './pages/admin/ManageAcademiasPage.jsx';
import ManageFederacoesPage from './pages/admin/ManageFederacoesPage.jsx';
import ManageModalidadesPage from './pages/admin/ManageModalidadesPage.jsx';
import ManageGraduacoesPage from './pages/admin/ManageGraduacoesPage.jsx';
import ManageNoticiasPage from './pages/admin/ManageNoticiasPage.jsx';
import ManagePagamentosPage from './pages/admin/ManagePagamentosPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import ManageCompeticoesPage from './pages/admin/ManageCompeticoesPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Rotas Protegidas Atleta
      { path: 'perfil-atleta', element: <ProtectedRoute><PerfilAtletaPage /></ProtectedRoute> },
      { path: 'filiacao', element: <ProtectedRoute><FiliacaoPage /></ProtectedRoute> },
      { path: 'minhas-filiacoes', element: <ProtectedRoute><MinhasFiliacoesPage /></ProtectedRoute> },
      { path: 'pagamento/:pagamentoId', element: <ProtectedRoute><PagamentoPage /></ProtectedRoute> },

      // Competições (público: lista e detalhes)
      { path: 'competicoes', element: <CompeticoesPage /> },
      { path: 'competicoes/:eventoId', element: <CompeticaoDetalhePage /> },
      // Minhas inscrições (atleta logado)
      { path: 'competicoes/minhas-inscricoes', element: <ProtectedRoute><MinhasInscricoesCompeticaoPage /></ProtectedRoute> },

      // Central de Aprovações (Professor/Admin)
      { path: 'admin/filiacoes-pendentes', element: <ProfessorAdminRoute><AprovacoesPage /></ProfessorAdminRoute> },

      // ✅ DETALHE TAMBÉM PARA PROFESSOR/TREINADOR/ADMIN
      { path: 'admin/aprovacao/:filiacaoId', element: <ProfessorAdminRoute><AprovacaoDetalhePage /></ProfessorAdminRoute> },
    ],
  },

  {
    path: '/admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'modalidades', element: <ManageModalidadesPage /> },
      { path: 'graduacoes', element: <ManageGraduacoesPage /> },
      { path: 'competicoes', element: <ManageCompeticoesPage /> },
      { path: 'federacoes', element: <ManageFederacoesPage /> },
      { path: 'academias', element: <ManageAcademiasPage /> },
      { path: 'noticias', element: <ManageNoticiasPage /> },
      { path: 'pagamentos', element: <ManagePagamentosPage /> },

      // ❌ REMOVIDO: isso bloqueia professor por estar sob AdminRoute
      // { path: 'aprovacao/:filiacaoId', element: <AprovacaoDetalhePage /> },
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
