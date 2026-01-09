import axios from 'axios';

const host = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// Tengo esta por si necesito la ruta con /api, en local funciona sin la /api y en servidor render con /api.
const API_BASE_URL = `${host.replace(/\/$/, '')}/api`;
// const API_BASE_URL = `${host.replace(/\/$/, '')}`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ¡Clave! Asegura que las cookies se envíen en cada petición.
});

// Función para establecer el token de acceso en los encabezados
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Interceptor de peticiones para añadir el token a cada llamada
apiClient.interceptors.request.use(config => {
  // No es necesario hacer nada aquí si usamos setAuthToken desde el contexto
  return config;
});

export default apiClient;