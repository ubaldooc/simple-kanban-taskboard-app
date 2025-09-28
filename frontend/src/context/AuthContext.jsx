import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Crear el contexto
const AuthContext = createContext();

// 2. Crear el componente Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Carga inicial del token
  const [authMode, setAuthMode] = useState('guest');

  // Efecto que se ejecuta cuando el token cambia. Es el cerebro de la autenticación.
  useEffect(() => {
    if (token) {
      // Si hay un token, estamos en modo online.
      // Aquí podrías decodificar el token para obtener datos del usuario si lo necesitas.
      // Por ejemplo: const decodedUser = jwt_decode(token); setUser(decodedUser);
      localStorage.setItem('token', token); // Guarda/actualiza el token en localStorage
      setAuthMode('online');
    } else {
      // Si no hay token, estamos en modo invitado.
      localStorage.removeItem('token');
      setUser(null);
      setAuthMode('guest');
    }
  }, [token]); // Este efecto se dispara cada vez que el 'token' cambia

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      // NOTA: Necesitarás crear esta ruta en tu backend
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales incorrectas');
      }

      const data = await response.json();
      
      // Al recibir el token, el useEffect de arriba se encargará de cambiar el modo
      setToken(data.token); 
      
      return { success: true };
    } catch (error) {
      console.error("Error en el login:", error);
      return { success: false, message: error.message };
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    // Al poner el token a null, el useEffect se encargará de cambiar el modo a 'guest'
    setToken(null);
  };

  // 3. Valores que se expondrán a los componentes hijos
  const value = {
    user,
    token,
    authMode,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};