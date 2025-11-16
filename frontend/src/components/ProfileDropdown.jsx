import React, { useState, useEffect, useRef } from "react";
import profileImage from "../assets/profile.webp";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({ onOpenHelpModal, onOpenWallpaperModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { user, authMode, logout } = useAuth();
  const navigate = useNavigate();

  const isOnline = authMode === "online";

  const handleLoginRedirect = () => {
    navigate("/login");
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Efecto para cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determina qué imagen de perfil mostrar
  const avatarSrc = user?.picture || profileImage;

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <img
        src={avatarSrc}
        alt="User Avatar"
        className="avatar"
        referrerPolicy="no-referrer"
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="profile-dropdown-menu">
          {isOnline ? (
            <div className="profile-dropdown-header">
              <img src={avatarSrc} alt="User Avatar" className="avatar-large" />
              <div className="user-info">
                <span>{user.email}</span>
                <strong>{user.name}</strong>
              </div>
            </div>
          ) : (
            <div className="profile-dropdown-header">
              <img
                src={profileImage}
                alt="User Avatar"
                className="avatar-large"
              />
              <div className="user-info">
                <strong>Invitado</strong>
                <button
                  className="dropdown-action-button"
                  onClick={handleLoginRedirect}
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}
          <hr className="dropdown-divider" />
          <ul>
            {/* Botón para cambiar el wallpaper */}
            <li onClick={onOpenWallpaperModal}>
              <i className="fas fa-image"></i> Cambiar fondo
            </li>
            {/* Botón para cambiar el tema */}
            <li onClick={toggleTheme}>
              <i
                className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"}`}
              ></i>
              Modo {theme === "dark" ? "Claro" : "Oscuro"}
            </li>
            <li>
              <i className="fas fa-comment-alt"></i> Enviar comentarios
            </li>
            <li onClick={onOpenHelpModal}>
              <i className="fas fa-question-circle"></i>
              Ayuda y Atajos
            </li>
          </ul>
          {isOnline && (
            <>
              <hr className="dropdown-divider" />
              <ul>
                <li onClick={handleLogout} style={{ cursor: "pointer" }}>
                  <i className="fas fa-sign-out-alt"></i> Cerrar sesión
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
