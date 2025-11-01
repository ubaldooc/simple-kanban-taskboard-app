import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import toast from "react-hot-toast";
import "./WallpaperModal.css"; // Renombrado de WallpaperManager.css

const WallpaperModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [selectedWallpaper, setSelectedWallpaper] = useState(
    user?.wallpaper || "/wallpapers/wallpaper-0.jpg"
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Lista de imágenes predefinidas (puedes mover esto a un archivo de configuración si crece)
  const predefinedWallpapers = Array.from(
    { length: 27 }, // 27 para incluir 0-26
    (_, i) => `/wallpapers/wallpaper-${i}.jpg`
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
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setSelectedWallpaper(null); // Deselecciona cualquier predefinido
      setPreview(URL.createObjectURL(file));
    }
  };

  // Maneja la selección de un wallpaper predefinido
  const handlePredefinedSelect = (url) => {
    setSelectedWallpaper(url);
    setFile(null); // Limpia cualquier archivo seleccionado
    setPreview(null);
  };

  // Guarda la selección (ya sea predefinida o subida)
  const handleSave = async () => {
    setIsUploading(true);
    const formData = new FormData();

    // Si hay un archivo, lo añadimos al FormData.
    // Si no, añadimos la URL del fondo predefinido.
    if (file) {
      formData.append("wallpaper", file);
    } else {
      formData.append("wallpaperUrl", selectedWallpaper);
    }

    try {
      const response = await apiClient.put("/user/wallpaper", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Actualiza el estado del usuario en el contexto con la respuesta del backend
      setUser({ ...user, wallpaper: response.data.wallpaper });
      toast.success("Fondo de pantalla guardado.");
    } catch (error) {
      toast.error("Error al guardar el fondo de pantalla.");
    } finally {
      setIsUploading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="wallpaper-modal-box" ref={modalRef}>
        <h2 className="modal-title">Cambiar fondo de pantalla</h2>
        <button className="close-button" onClick={onClose}>
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
        </div>

        <div className="upload-section">
          <button
            className="upload-button"
            onClick={() => fileInputRef.current.click()}
          >
            <i className="fas fa-upload"></i> Subir una imagen
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
          />
          {preview && (
            <div className="upload-preview">
              <span>Selección actual:</span>
              <img src={preview} alt="Vista previa" />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="modal-btn modal-btn-confirm"
            onClick={handleSave}
            disabled={
              isUploading || (!file && selectedWallpaper === user?.wallpaper)
            }
          >
            {isUploading ? (
              <>
                <span className="spinner-small"></span> Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WallpaperModal;
