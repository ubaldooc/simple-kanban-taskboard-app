import React, { useState, useEffect, useRef } from 'react';
import profileImage from '../assets/profile.png';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, authMode, logout } = useAuth();
  const navigate = useNavigate();

  const isOnline = authMode === 'online';
  
  const handleLoginRedirect = () => {
    navigate('/login');
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
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
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
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
                  <button className="dropdown-action-button" onClick={handleLoginRedirect}>
                      <i className="fas fa-sign-in-alt"></i>
                      Iniciar sesión
                  </button>
                </div>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;