import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

// Este componente recebe 'children' (a página que ele está protegendo)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Se estiver checando a autenticação (carregando token do localStorage)
    // não renderiza nada ainda.
    return <p>Verificando autenticação...</p>;
  }

  if (!user) {
    // Usuário NÃO está logado.
    // Redireciona para /login, guardando a página que ele tentou acessar (location)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuário ESTÁ logado. Renderiza a página protegida.
  return children;
}

export default ProtectedRoute;