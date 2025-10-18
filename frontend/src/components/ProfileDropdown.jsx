import React, { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import profileImage from '../assets/profile.png';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null); // Estado para guardar la info del usuario
  const dropdownRef = useRef(null);

  const isOnline = !!user; // El usuario está "online" si el objeto user existe

  // Hook de Google para iniciar sesión
  const login = useGoogleLogin({
    // Cambiamos el flujo para obtener un código de autorización
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        // Enviamos el código al backend. El backend se encargará de verificarlo.
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
        const { data } = await axios.post(apiUrl, {
          code: codeResponse.code,
        });

        // El backend nos devuelve la info del usuario y un token de sesión (JWT)
        localStorage.setItem('token', data.token); // Guardamos el token de sesión
        setUser(data.user); // Guardamos la información del usuario en el estado
        setIsOpen(true); // Mantenemos el menú abierto para mostrar la nueva info
      } catch (error) {
        console.error('Error en el inicio de sesión:', error);
      }
    },
    onError: (error) => console.error('Login Failed:', error),
  });

  const logout = () => {
    localStorage.removeItem('token'); // Limpiamos el token de sesión
    setUser(null); // Limpiamos la información del usuario
    setIsOpen(false); // Cerramos el dropdown
  };

  // Efecto para cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determina qué imagen de perfil mostrar
  const avatarSrc = user?.picture || profileImage;

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <img
        src={avatarSrc}
        alt="User Avatar"
        className="avatar"
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="profile-dropdown-menu">
           {isOnline ? (
            // Vista para usuario que ha iniciado sesión
            <>
              <div className="profile-dropdown-header">
                <img src={avatarSrc} alt="User Avatar" className="avatar-large" />
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <hr className="dropdown-divider" />
              <ul>
                <li><i className="fas fa-moon"></i> Modo oscuro</li>
                <li><i className="fas fa-comment-alt"></i> Enviar comentarios</li>
              </ul>
              <hr className="dropdown-divider" />
              <ul>
                <li onClick={logout} style={{ cursor: 'pointer' }}>
                  <i className="fas fa-sign-out-alt"></i> Cerrar sesión
                </li>
              </ul>
            </>
          ) : (
            // Vista para usuario invitado
            <>
            <div className="profile-dropdown-header">
              <img src={profileImage} alt="User Avatar" className="avatar-large" />
              <div className="user-info">
                <strong>Invitado</strong>
              </div>
            </div>
            <hr className="dropdown-divider" />
              <ul className="google-login-section">
                <li>
                  <button className="google-login-button" onClick={() => login()}>
                    <span className="google-icon"></span>
                    Iniciar sesión con Google
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;