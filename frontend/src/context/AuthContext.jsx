import React, { createContext, useState, useContext, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import apiClient, { setAuthToken } from "../api/axios.js"; // Importamos la nueva función
import toast from "react-hot-toast";

// 1. Crear el contexto
const AuthContext = createContext();

// 2. Crear el componente Proveedor del contexto
export const AuthProvider = ({ children }) => {
  // Al iniciar, intentamos cargar el usuario desde localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  // Estado para el Access Token (se guarda en memoria)
  const [accessToken, setAccessToken] = useState(null);
  const [authMode, setAuthMode] = useState("guest");
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Nuevo estado de carga
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Estado para el modal de cierre de sesión

  // Efecto que se ejecuta cuando el estado del usuario cambia.
  useEffect(() => {
    if (user) {
      // Si hay usuario, asumimos que tenemos un token y lo configuramos en axios
      setAuthToken(accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      // console.log("AuthContext: User set, authMode online, token set in axios.");
      setAuthMode("online");
    } else {
      setAuthToken(null); // Asegurarse de limpiar el token de axios
      localStorage.removeItem("user");
      setAuthMode("guest");
    }
  }, [user, accessToken]); // Este efecto se dispara si cambia el usuario o el token

  // Efecto para verificar la sesión al cargar la app ("Silent Refresh")
  useEffect(() => {
    const verifyUser = async () => {
      // Si no hay usuario en localStorage, no hay nada que verificar.
      if (!user) {
        setIsAuthLoading(false);
        return;
      }
      try {
        console.log("Verificando sesión existente...");
        const { data } = await apiClient.post("/auth/refresh");
        setAccessToken(data.accessToken);
        setAuthToken(data.accessToken); // <-- ¡Añadir esta línea!
      } catch (err) {
        console.log("No se pudo refrescar la sesión, cerrando sesión local.");
        setUser(null); // Limpia el estado si el refresh token es inválido
      } finally {
        setIsAuthLoading(false);
      }
    };
    verifyUser();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar.

  // Efecto para configurar el interceptor de Axios para manejar tokens expirados
  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response, // Si la respuesta es exitosa (2xx), no hacemos nada.
      async (error) => {
        const originalRequest = error.config;
        const isUnauthorizedError = error.response?.status === 401;
        const backendErrorMessage = error.response?.data?.message;

        // Si el error es 401 y es por token expirado, y no hemos reintentado ya
        if (
          isUnauthorizedError &&
          backendErrorMessage === "Token de autenticación expirado." &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true; // Marcar para evitar bucles infinitos
          try {
            console.log(
              "Interceptor: Access token expirado. Intentando refrescar..."
            );
            const { data } = await apiClient.post("/auth/refresh");
            const newAccessToken = data.accessToken;

            // Actualizar el estado y los encabezados de axios
            setAccessToken(newAccessToken);
            setAuthToken(newAccessToken);

            // Reintentar la petición original con el nuevo token
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            // Si el refresh token también falla, cerramos la sesión
            console.log("Interceptor: Refresh token falló. Cerrando sesión.");
            toast.error(
              "Tu sesión ha expirado. Por favor, inicia sesión de nuevo."
            );
            logout(false);
            return Promise.reject(refreshError);
          }
        }

        // Si el error es 403 (Forbidden) o un 401 que no es por token expirado,
        // simplemente lo propagamos para que el componente lo maneje.
        return Promise.reject(error); // Propagamos el error para que otros 'catch' puedan manejarlo.
      }
    );

    // Función de limpieza para remover el interceptor cuando el componente se desmonte.
    return () => apiClient.interceptors.response.eject(responseInterceptor);
  }, [accessToken]); // Re-ejecutar si el token cambia para tener el closure correcto

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });

      // Guardamos el usuario y el accessToken
      setUser(data.user);
      setAuthToken(data.accessToken); // <-- ¡Añadir esta línea!
      setAccessToken(data.accessToken);
      return { success: true };
    } catch (error) {
      // El manejo de errores de Axios es un poco diferente
      console.error("Error en el login:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Credenciales incorrectas";
      return { success: false, message };
    }
  };

  // Función para iniciar sesión con Google
  const loginWithGoogle = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        const { data } = await apiClient.post("/auth/google", {
          code: codeResponse.code,
        });

        // Guardamos el usuario y el accessToken
        setUser(data.user);
        setAuthToken(data.accessToken); // <-- ¡Añadir esta línea!
        setAccessToken(data.accessToken);
      } catch (error) {
        // Este console.log mejorado te dará más detalles si la petición al backend falla
        if (error.response) {
          console.error(
            "Error de respuesta del servidor:",
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          console.error(
            "La petición fue hecha pero no se recibió respuesta (¿backend caído o CORS?):",
            error.request
          );
        } else {
          console.error("Error al configurar la petición:", error.message);
        }
      }
    },
    onError: (error) => console.error("Fallo en el login de Google:", error),
  });

  // Función para registrar un nuevo usuario
  const register = async (name, email, password) => {
    try {
      const { data } = await apiClient.post("/auth/register", {
        name,
        email,
        password,
      });

      // Guardamos el usuario y el accessToken
      setUser(data.user);
      setAuthToken(data.accessToken); // <-- ¡Añadir esta línea!
      setAccessToken(data.accessToken);
      return { success: true };
    } catch (error) {
      console.error("Error en el registro:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "No se pudo completar el registro.";
      return { success: false, message };
    }
  };

  // Función para cerrar sesión
  const logout = async (callApi = true) => {
    setIsLoggingOut(true); // <-- Mostramos el modal
    try {
      // El parámetro 'callApi' nos permite evitar una llamada recursiva desde el interceptor.
      if (callApi) {
        await apiClient.post("/auth/logout"); // El backend invalidará el refresh token
      }
    } catch (error) {
      console.error("Error durante el cierre de sesión en la API:", error);
    } finally {
      // Limpiamos todo en el frontend
      setAccessToken(null);
      setUser(null); // Limpia el estado del frontend independientemente del resultado del backend
      setAuthToken(null); // Limpia el encabezado de autorización de Axios
      // Ocultamos el modal de cierre de sesión
      setIsLoggingOut(false);
    }
  };

  // 3. Valores que se expondrán a los componentes hijos
  const value = {
    user,
    accessToken,
    authMode,
    isAuthLoading, // Exponemos el estado de carga
    isLoggingOut, // Exponemos el estado de cierre de sesión
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
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
