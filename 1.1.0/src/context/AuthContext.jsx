import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const setAuthentication = (token, setAuthState) => {
  try {
    const decodedUser = jwtDecode(token);
    if (decodedUser.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const user = { id: decodedUser.id, tipo: decodedUser.tipo };
    setAuthState({ token, user });
    return user;
  } catch (error) {
    console.error("Token inválido", error);
    localStorage.removeItem('token');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthentication(token, setAuthState);
    }
    setLoading(false);
  }, []);

  // --- MUDANÇA NA ASSINATURA E NO CORPO ---
  const login = async (email, senha) => {
    try {
      // Envia { email, senha }
      const response = await axios.post('/api/auth/login', { email, senha });
      const { token } = response.data;
      setAuthentication(token, setAuthState);
      return { success: true };
    } catch (error) {
      console.error("Erro no login:", error.response?.data?.msg);
      return { success: false, message: error.response?.data?.msg || "Erro desconhecido" };
    }
  };

  // --- MUDANÇA NA ASSINATURA E NO CORPO ---
  const register = async (email, senha, tipo = 'atleta') => {
    try {
      // Envia { email, senha, tipo }
      const response = await axios.post('/api/auth/registrar', { email, senha, tipo });
      const { token } = response.data;
      setAuthentication(token, setAuthState);
      return { success: true };
    } catch (error) {
      console.error("Erro no registro:", error.response?.data?.msg);
      return { success: false, message: error.response?.data?.msg || "Erro desconhecido" };
    }
  };
  // --- FIM DAS MUDANÇAS ---

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({ token: null, user: null });
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    ...authState,
    loading,
    login,
    register,
    logout
  };

  if (loading) {
    return <p>Carregando aplicação...</p>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};