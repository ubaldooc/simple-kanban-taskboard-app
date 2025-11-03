import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./WallpaperModal.css"; // Renombrado de WallpaperManager.css
import { getApiService } from "../services/apiService";

const WallpaperModal = ({ isOpen, onClose, onGuestWallpaperChange }) => {
  const { user, setUser, authMode } = useAuth();
  const [selectedWallpaper, setSelectedWallpaper] = useState(
    user?.wallpaper || "/wallpapers/wallpaper-0.webp"
  );
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // ¡CAMBIO CLAVE! Seleccionamos la API correcta (online o guest)
  const api = useMemo(() => getApiService(authMode), [authMode]);

  // Lista de imágenes predefinidas (puedes mover esto a un archivo de configuración si crece)
  const predefinedWallpapers = Array.from(
    { length: 26 }, // 27 para incluir 0-26
    (_, i) => `/wallpapers/wallpaper-${i}.webp`
  );

  // Efecto para cerrar el modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Maneja la selección de un archivo local
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("wallpaper", file);

      try {
        // En modo offline, la subida de archivos no está soportada.
        if (authMode === "guest") {
          toast.error(
            "La subida de fondos solo está disponible para usuarios registrados."
          );
          return;
        }
        // Usamos la API online para subir el archivo
        const response = await api.updateUserWallpaper(formData);
        setUser({ ...user, wallpaper: response.wallpaper });
        setSelectedWallpaper(response.wallpaper);
        toast.success("Fondo de pantalla subido.");
      } catch (error) {
        toast.error("Error al subir la imagen.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Maneja la selección de un wallpaper predefinido
  const handlePredefinedSelect = async (url) => {
    // Si ya está seleccionado, no hacer nada
    if (url === selectedWallpaper) return;

    // Guardamos el wallpaper original para poder revertir en caso de error.
    // Usamos el estado 'selectedWallpaper' como fuente de verdad antes del cambio.
    const originalWallpaper = selectedWallpaper;

    // Actualización optimista
    setSelectedWallpaper(url);
    // Si hay un usuario (modo online), actualizamos su objeto.
    // Si no (modo guest), esta operación se omite de forma segura.
    if (user) {
      setUser({ ...user, wallpaper: url });
    } else {
      // ¡CAMBIO CLAVE! Notificamos al componente App que el wallpaper del invitado ha cambiado.
      onGuestWallpaperChange(url);
    }

    // Petición al backend
    try {
      await api.updateUserPreferences({ wallpaper: url });
      // No es necesario un toast de éxito para que sea más fluido
    } catch (error) {
      toast.error("No se pudo guardar el fondo.");
      // Revertir en caso de error
      setSelectedWallpaper(originalWallpaper);
      if (user) {
        setUser({ ...user, wallpaper: originalWallpaper });
      } else {
        onGuestWallpaperChange(originalWallpaper);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wallpaper-modal-box" ref={modalRef}>
        <h2 className="modal-title">Cambiar fondo de pantalla</h2>
        <button className="close-button" onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-times"></i>
        </button>

        <p className="modal-subtitle">
          Elige uno de nuestros fondos o sube el tuyo.
        </p>

        <div className="wallpaper-grid">
          {predefinedWallpapers.map((url, index) => (
            <div
              key={index}
              className={`wallpaper-item ${
                selectedWallpaper === url ? "selected" : ""
              }`}
              style={{ backgroundImage: `url(${url})` }}
              onClick={() => handlePredefinedSelect(url)}
            >
              <div className="selection-checkmark">
                <i className="fas fa-check"></i>
              </div>
            </div>
          ))}
          {/* Botón para subir imagen, integrado en la cuadrícula */}
          <div
            className="wallpaper-item upload-placeholder"
            onClick={() => fileInputRef.current.click()}
          >
            {isUploading ? (
              <span className="spinner-small"></span>
            ) : (
              <i className="fas fa-plus"></i>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );
};

export default WallpaperModal;
