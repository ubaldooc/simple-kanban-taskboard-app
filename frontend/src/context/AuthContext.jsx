import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Necesitarás instalar 'jwt-decode'
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

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
      try {
        // Decodificamos el token para obtener la información del usuario
        const decoded = jwtDecode(token);
        // El ID es lo más importante que extraemos del token al recargar.
        // El resto de la info (name, picture) se establecerá durante el login inicial.
        // Opcional: podrías tener un endpoint /api/me para refrescar los datos del usuario.
        setUser(prevUser => ({ ...prevUser, id: decoded.userId }));
      } catch (error) {
        console.error("Error decodificando el token:", error);
        setToken(null); // Si el token es inválido, lo eliminamos
      }
      localStorage.setItem('token', token); // Guarda/actualiza el token en localStorage
      setAuthMode('online');
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setAuthMode('guest');
    }
  }, [token]); // Este efecto se dispara cada vez que el 'token' cambia

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
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
      
      // Al recibir el token, el useEffect de arriba se encargará de cambiar el modo
      setToken(data.token); 
      
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
        const { data } = await axios.post(apiUrl, {
          code: codeResponse.code,
        });
        
        // El backend nos devuelve el usuario completo y el token.
        // Actualizamos nuestro estado global.
        setUser(data.user);
        setToken(data.token);
        
      } catch (error) {
        console.error('Error en el inicio de sesión con Google:', error);
      }
    },
    onError: (error) => console.error('Fallo en el login de Google:', error),
  });

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