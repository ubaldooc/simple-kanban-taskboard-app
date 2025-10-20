// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  // Si no hay usuario, redirige a la página de login.
  // 'replace' evita que el usuario pueda volver a la página anterior con el botón de "atrás".
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay un usuario, renderiza el componente hijo que la ruta está protegiendo.
  // <Outlet /> es un marcador de posición de react-router para el componente de la ruta anidada.
  return <Outlet />;
};

export default ProtectedRoute;
