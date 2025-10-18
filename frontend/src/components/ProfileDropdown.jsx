import React, { useState, useEffect, useRef } from 'react';
import profileImage from '../assets/profile.png';

const ProfileDropdown = ({ isOnline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <img
        src={profileImage}
        alt="User Avatar"
        className="avatar"
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <img src={profileImage} alt="User Avatar" className="avatar-large" />
            <div className="user-info">
              <strong>{isOnline ? 'Ubaldo Ocampo' : 'Invitado'}</strong>
              {isOnline && <span>ubaldooc@gmail.com</span>}
            </div>
            <ul className="google-login-section">
              <li>
                <button className="google-login-button">
                  <span className="google-icon"></span>
                  Iniciar sesión con Google
                </button>
              </li>
            </ul>
          </div>
          <hr className="dropdown-divider" />
          <ul>
            <li><i className="fas fa-moon"></i> Modo oscuro</li>
          </ul>
          <hr className="dropdown-divider" />
          <ul>
            <li><i className="fas fa-comment-alt"></i> Enviar comentarios</li>
          </ul>
          <hr className="dropdown-divider" />
          <ul>
            <li><i className="fas fa-sign-out-alt"></i> Cerrar sesión</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;