import React, { createContext, useState, useContext, useEffect } from 'react';
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
    try {
      // NOTA: Esta ruta no existe actualmente en tu backend. BUSCA LA RUTA CORRECTA Y CAMBIALA
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`;
      const { data } = await axios.post(apiUrl, 
        { email, password },
        { withCredentials: true } // Importante si usas cookies para la sesión
      );
      
      // El backend establece la cookie, aquí solo actualizamos el usuario
      setUser(data.user);
      return { success: true };
    } catch (error) {
      // El manejo de errores de Axios es un poco diferente
      console.error("Error en el login:", error);
      const message = error.response?.data?.message || error.message || 'Credenciales incorrectas';
      return { success: false, message };
    }
  };

  // Función para iniciar sesión con Google
  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        // const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
        const apiUrl = `http://localhost:5001/api/auth/google`;

        // Es importante incluir 'withCredentials: true' para que axios envíe y reciba cookies
        const { data } = await axios.post(apiUrl, 
          { code: codeResponse.code },
          { withCredentials: true }
        );
        
        // El backend ya estableció la cookie del token.
        // Aquí solo necesitamos guardar el objeto de usuario en el estado.
        setUser(data.user);
        
      } catch (error) {
        // Este console.log mejorado te dará más detalles si la petición al backend falla
        if (error.response) {
          console.error('Error de respuesta del servidor:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('La petición fue hecha pero no se recibió respuesta (¿backend caído o CORS?):', error.request);
        } else {
          console.error('Error al configurar la petición:', error.message);
        }
      }
    },
    onError: (error) => console.error('Fallo en el login de Google:', error),
  });

  // Función para registrar un nuevo usuario
  const register = async (name, email, password) => {
    try {
      // NOTA: Esta ruta aún no existe en tu backend. Deberás crearla.
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`;
      const { data } = await axios.post(apiUrl, 
        { name, email, password },
        { withCredentials: true }
      );
      
      // Después de un registro exitoso, el backend nos devuelve el usuario y establece la cookie.
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Error en el registro:", error);
      const message = error.response?.data?.message || error.message || 'No se pudo completar el registro.';
      return { success: false, message };
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      // Asegúrate que la ruta en tu backend sea consistente (ej. /api/auth/logout)
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/logout`;
      await axios.post(apiUrl, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
    } finally {
      setUser(null); // Limpia el estado del frontend independientemente del resultado del backend
    }
  };

  // 3. Valores que se expondrán a los componentes hijos
  const value = {
    user,
    authMode,
    login,
    register,
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