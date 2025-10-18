import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Necesitarás instalar 'jwt-decode'
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

// 1. Crear el contexto
const AuthContext = createContext();

// 2. Crear el componente Proveedor del contexto
export const AuthProvider = ({ children }) => {
  // Al iniciar, intentamos cargar el usuario desde localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  // Ya no necesitamos manejar el token en el estado, el navegador lo gestiona.
  // Mantenemos un estado simple para saber si estamos autenticados.
  const [authMode, setAuthMode] = useState('guest');

  // Efecto que se ejecuta cuando el estado del usuario cambia.
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setAuthMode('online');
    } else {
      localStorage.removeItem('user');
      setAuthMode('guest');
    }
  }, [user]); // Este efecto se dispara cada vez que el 'user' cambia

  // Función para iniciar sesión
  const login = async (email, password) => {
    try { // NOTA: Esta ruta no existe actualmente en tu backend.
      const response = await fetch('http://localhost:5001/api/auth/login', {  // BUSCA LA RUTA CORRECTA Y CAMBIALA
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales incorrectas');
      }

      const data = await response.json();
      // El backend establece la cookie, aquí solo actualizamos el usuario
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Error en el login:", error);
      return { success: false, message: error.message };
    }
  };

  // Función para iniciar sesión con Google
  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
        // Es importante incluir 'withCredentials: true' para que axios envíe y reciba cookies
        const { data } = await axios.post(apiUrl, 
          { code: codeResponse.code },
          { withCredentials: true }
        );
        
        // El backend ya estableció la cookie del token.
        // Aquí solo necesitamos guardar el objeto de usuario en el estado.
        setUser(data.user);
        
      } catch (error) {
        console.error('Error en el inicio de sesión con Google:', error);
      }
    },
    onError: (error) => console.error('Fallo en el login de Google:', error),
  });

  // Función para cerrar sesión
  const logout = () => {
    // TODO: Crear un endpoint en el backend para limpiar la cookie, ej: /api/auth/logout
    setUser(null); // Esto limpiará el estado y localStorage en el frontend
  };

  // 3. Valores que se expondrán a los componentes hijos
  const value = {
    user,
    authMode,
    login,
    logout,
    loginWithGoogle, // Exportamos la nueva función
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