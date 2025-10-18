import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Necesitarás instalar 'jwt-decode'

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
        const decodedUser = jwtDecode(token);
        setUser({
          id: decodedUser.userId,
          name: decodedUser.name,
          email: decodedUser.email,
          picture: decodedUser.picture, // Asumiendo que lo incluyes en el JWT
        });
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
  const loginWithGoogle = async (idToken) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión con Google');
      }

      const data = await response.json();
      setToken(data.token); // Al actualizar el token, el useEffect se encargará del resto
      return { success: true };
    } catch (error) {
      console.error("Error en el login con Google:", error);
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