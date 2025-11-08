import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import apiClient from "../api/axios"; // Importamos apiClient directamente
import "./WallpaperModal.css"; // Renombrado de WallpaperManager.css
import { getApiService } from "../services/apiService";

const WallpaperModal = ({ isOpen, onClose, onGuestWallpaperChange }) => {
  const { user, setUser, authMode } = useAuth();
  const [selectedWallpaper, setSelectedWallpaper] = useState(
    user?.wallpaper || "https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp"
  );
  const [file, setFile] = useState(null);
  // Nuevos estados para los wallpapers predefinidos y la carga
  const [predefinedWallpapers, setPredefinedWallpapers] = useState([]);
  const [isLoadingWallpapers, setIsLoadingWallpapers] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const api = useMemo(() => getApiService(authMode), [authMode]);

  // Efecto para obtener los wallpapers predefinidos desde el backend
  useEffect(() => {
    // Solo hacemos la petición si el modal está abierto y los wallpapers no se han cargado aún.
    if (isOpen && predefinedWallpapers.length === 0) {
      const fetchWallpapers = async () => {
        setIsLoadingWallpapers(true);
        try {
          const { data } = await apiClient.get("/wallpapers/predefined");
          setPredefinedWallpapers(data);
        } catch (error) {
          console.error("Error al cargar los wallpapers predefinidos:", error);
          toast.error("No se pudieron cargar los fondos.");
        } finally {
          setIsLoadingWallpapers(false);
        }
      };
      fetchWallpapers();
    }
  }, [isOpen, predefinedWallpapers.length]); // Se ejecuta cuando el modal se abre

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

    // Actualización visual optimista
    setSelectedWallpaper(url);

    if (authMode === "online") {
      try {
        // 1. Llama a la API para guardar el cambio en la base de datos.
        await api.updateUserWallpaper({ wallpaperUrl: url });

        // 2. Si tiene éxito, actualiza el estado global del usuario.
        // AuthContext se encargará de persistir el objeto 'user' en localStorage.
        setUser({ ...user, wallpaper: url });

      } catch (error) {
        toast.error("No se pudo guardar el fondo.");
        // Revertir en caso de error
        setSelectedWallpaper(originalWallpaper);
      }
    } else {
      // Modo Offline (Invitado)
      try {
        // 1. Modifica la subclave wallpaper dentro de taskboardData en localStorage.
        const guestDataString = localStorage.getItem('taskboardData');
        const guestData = guestDataString ? JSON.parse(guestDataString) : {};
        guestData.preferences = { ...guestData.preferences, wallpaper: url };
        localStorage.setItem('taskboardData', JSON.stringify(guestData));

        // 2. Llama a la función que actualiza el estado en App.jsx para que WallpaperSetter reaccione.
        onGuestWallpaperChange(url);

      } catch (e) {
        toast.error("No se pudo guardar el fondo en el navegador.");
        setSelectedWallpaper(originalWallpaper);
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

        {/* Mensaje de error fuera del contenedor wallpaper-grid */}
        {!isLoadingWallpapers && predefinedWallpapers.length === 0 && (
          <div className="wallpaper-error">
            <p>No se pudieron cargar los fondos de pantalla.</p>
          </div>
        )}

        <div className="wallpaper-grid">
          {isLoadingWallpapers ? (
            // Mostramos un spinner mientras se cargan los fondos
            <div className="wallpaper-loading-container">
              <span className="spinner-small"></span>
            </div>
          ) : (
            predefinedWallpapers.map((url, index) => (
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
            ))
          )}

          {/* Botón de agregar wallpaper solo se muestra si los fondos se cargaron correctamente */}
          {!isLoadingWallpapers && predefinedWallpapers.length > 0 && (
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
  );
};

export default WallpaperModal;
