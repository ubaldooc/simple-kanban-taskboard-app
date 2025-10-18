import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProfileDropdownMenu = ({ isOpen, onClose }) => {
  const { user, authMode, logout, loginWithGoogle } = useAuth();
  const dropdownRef = useRef(null);

  // Cierra el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Función de callback para el login de Google
  const handleGoogleLogin = async (response) => {
    if (response.credential) {
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        toast.success('¡Inicio de sesión exitoso!');
        onClose(); // Cierra el dropdown después del login
      } else {
        toast.error(result.message || 'Error al iniciar sesión con Google.');
      }
    }
  };

  // Inicializa Google Sign-In cuando el componente se monta y es visible
  useEffect(() => {
    // Solo inicializa si el dropdown está abierto, el usuario es invitado y la API de Google está cargada
    if (isOpen && authMode === 'guest' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      // Renderiza el botón de Google en el div designado
      window.google.accounts.id.renderButton(
        document.getElementById('google-sign-in-button'),
        { theme: 'outline', size: 'large', text: 'signin_with', width: '250', logo_alignment: 'left' }
      );

      // Opcional: Muestra el One Tap UI (el popup que sugiere iniciar sesión)
      // window.google.accounts.id.prompt();
    }
  }, [isOpen, authMode]); // Se re-ejecuta si cambia la visibilidad o el modo de autenticación

  if (!isOpen) return null;

  return (
    <div className="profile-dropdown-menu" ref={dropdownRef}>
      {authMode === 'online' && user ? (
        <>
          <div className="profile-dropdown-header">
            <img 
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
              alt="Avatar" 
              className="avatar-large" 
            />
            <div className="user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <hr className="dropdown-divider" />
          <ul>
            <li><i className="fas fa-user-circle"></i> Mi Perfil</li>
            <li><i className="fas fa-cog"></i> Configuración</li>
            <hr className="dropdown-divider" />
            <li onClick={logout}><i className="fas fa-sign-out-alt"></i> Cerrar Sesión</li>
          </ul>
        </>
      ) : (
        <>
          <div className="profile-dropdown-header">
            <img 
              src={`https://ui-avatars.com/api/?name=Guest&background=0D1117&color=E6EDF3`} 
              alt="Guest Avatar" 
              className="avatar-large" 
            />
            <div className="user-info">
              <strong>Invitado</strong>
              <span>Inicia sesión para guardar tu progreso</span>
            </div>
          </div>
          <hr className="dropdown-divider" />
          <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center' }}>
            {/* Este div es el contenedor donde Google renderizará su botón */}
            <div id="google-sign-in-button"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDropdownMenu;