import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Verificando autenticação...</p>;
  }

  // 1. Verifica se está logado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 2. Verifica se é 'admin'
  if (user.tipo !== 'admin') {
    // Está logado, mas não é admin
    // Redireciona para a Home
    return <Navigate to="/" replace />;
  }
  
  // Usuário logado E é admin
  return children;
}

export default AdminRoute;