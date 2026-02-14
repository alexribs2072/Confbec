import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function ProfessorAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Verificando autenticação...</p>;
  }

  // 1. Verifica se está logado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 2. Verifica se é Admin, Professor ou Treinador
  const isAuthorized = user.tipo === 'admin' || user.tipo === 'professor' || user.tipo === 'treinador';

  if (!isAuthorized) {
    // Está logado, mas não é admin/professor
    // Redireciona para a Home (ou uma página "Acesso Negado")
    return <Navigate to="/" replace />;
  }
  
  // Usuário logado E autorizado
  return children;
}

export default ProfessorAdminRoute;