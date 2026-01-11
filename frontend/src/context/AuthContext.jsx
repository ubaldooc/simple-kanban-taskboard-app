import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Nuevo estado de carga
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Estado para el modal de cierre de sesión

  // Derivamos authMode para que sea reactivo y preciso.
  // Durante la carga inicial, "adivinamos" basándonos en si hay un usuario en localStorage.
  const authMode = useMemo(() => {
    if (isAuthLoading) {
      return localStorage.getItem("user") ? "online" : "guest";
    }
    return user && accessToken ? "online" : "guest";
  }, [isAuthLoading, user, accessToken]);

  // --- Refs para evitar dependencias en el interceptor ---
  // Usamos refs para que el interceptor siempre tenga acceso a la última versión
  // del token y de la función setUser sin necesidad de re-crearse.
  const accessTokenRef = useRef(accessToken);
  const setUserRef = useRef(setUser);
  useEffect(() => {
    accessTokenRef.current = accessToken;
    setUserRef.current = setUser;
  }, [accessToken, setUser]);
  // Efecto para persistir el usuario y configurar el token en Axios
  useEffect(() => {
    if (user && accessToken) {
      setAuthToken(accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    } else if (!isAuthLoading) {
      // Solo limpiamos si NO estamos cargando la autenticación inicial
      setAuthToken(null);
      localStorage.removeItem("user");
    }
  }, [user, accessToken, isAuthLoading]);

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
        setUser(data.user); // 
        setAccessToken(data.accessToken);
        setAuthToken(data.accessToken);
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
    // Este efecto ahora se ejecuta solo una vez al montar el componente.
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response, // Si la respuesta es exitosa (2xx), no hacemos nada.
      async (error) => {
        const originalRequest = error.config;
        const isUnauthorizedError = error.response?.status === 401;
        const backendErrorMessage = error.response?.data?.message;

        // Si el error es 401 y es por token expirado, y no hemos reintentado ya
        if (
          isUnauthorizedError &&
          backendErrorMessage === "El token de acceso ha expirado." &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true; // Marcar para evitar bucles infinitos
          try {
            console.log(
              "Interceptor: Access token expirado. Intentando refrescar..."
            );
            const { data } = await apiClient.post("/auth/refresh");
            const newAccessToken = data.accessToken;

            // Actualizar el estado usando las refs y los encabezados de axios
            setUserRef.current(data.user);
            setAccessToken(newAccessToken); // <-- ¡Esta es la línea que faltaba!
            setAuthToken(newAccessToken); // Esto actualiza el header por defecto de axios

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

        // Si el error es 403 (Forbidden) y el código es ALREADY_AUTHENTICATED,
        // significa que el usuario ya está autenticado e intentó acceder a login/register
        if (error.response?.status === 403 && error.response?.data?.code === 'ALREADY_AUTHENTICATED') {
          console.log('Usuario autenticado intentó acceder a ruta de autenticación');
          // No mostramos error, simplemente lo manejamos silenciosamente
          // El componente LoginPage ya redirige en el useEffect
          return Promise.reject(error);
        }

        // Si el error es 403 (Forbidden) o un 401 que no es por token expirado,
        // simplemente lo propagamos para que el componente lo maneje.
        return Promise.reject(error); // Propagamos el error para que otros 'catch' puedan manejarlo.
      }
    );

    // Función de limpieza para remover el interceptor cuando el componente se desmonte.
    return () => apiClient.interceptors.response.eject(responseInterceptor);
  }, []); // El array vacío asegura que el interceptor se configure una sola vez.

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

  // Función para cerrar sesión con un delay para el modal
  const logout = async (callApi = true) => {
    setIsLoggingOut(true); // <-- Mostramos el modal

    // Creamos una promesa que se resuelve después de 3 segundos
    const delay = new Promise((resolve) => setTimeout(resolve, 3000));

    // Ejecutamos la llamada a la API y el delay en paralelo
    await Promise.all([
      (async () => {
        try {
          if (callApi) {
            await apiClient.post("/auth/logout");
          }
        } catch (error) {
          console.error("Error durante el cierre de sesión en la API:", error);
        }
      })(),
      delay,
    ]);

    // Limpiamos todo en el frontend después de que ambas promesas se completen
    setAccessToken(null);
    setUser(null);
    setAuthToken(null);
    setIsLoggingOut(false); // Ocultamos el modal
  };

  // 3. Valores que se expondrán a los componentes hijos
  const value = {
    setUser, // <-- ¡Añadido! Ahora setUser está disponible para los consumidores del contexto.
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
