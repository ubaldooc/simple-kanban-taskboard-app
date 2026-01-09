import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import apiClient from "../api/axios"; // Importamos apiClient directamente
import "./WallpaperModal.css"; // Renombrado de WallpaperManager.css
import { getApiService } from "../services/apiService";
import ConfirmationModal from "./ConfirmationModal"; // Importamos el modal de confirmación

const WallpaperModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, setUser, authMode } = useAuth();
  const [selectedWallpaper, setSelectedWallpaper] = useState(
    user?.wallpaper || "https://res.cloudinary.com/drljxouhe/image/upload/v1764390345/wallpaper-0_w79dim.webp"
  );
  const [file, setFile] = useState(null);
  // Nuevos estados para los wallpapers predefinidos y la carga
  const [predefinedWallpapers, setPredefinedWallpapers] = useState([]);
  const [isLoadingWallpapers, setIsLoadingWallpapers] = useState(true);
  // Nuevo estado para los fondos subidos por el usuario
  const [customWallpapers, setCustomWallpapers] = useState(user?.customWallpapers || []);
  // Estado para el modal de confirmación de eliminación
  const [wallpaperToDelete, setWallpaperToDelete] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const api = useMemo(() => getApiService(authMode), [authMode]);

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

    // Cuando se abre el modal y estamos online, obtenemos los fondos personalizados.
    if (isOpen && authMode === 'online') {
      const fetchCustomWallpapers = async () => {
        try {
          const customWps = await api.getCustomWallpapers();
          setCustomWallpapers(customWps);
        } catch (error) {
          console.error("Error al cargar los fondos personalizados:", error);
          toast.error("No se pudieron cargar tus fondos.");
        }
      };
      fetchCustomWallpapers();
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
      // Comprobación del tamaño del archivo
      const maxSizeInBytes = 5 * 1024 * 1024; // 8 MB
      if (file.size > maxSizeInBytes) {
        toast.error("El archivo es demasiado grande. El tamaño máximo es de 8 MB.");
        return; // Detiene la ejecución si el archivo es muy grande
      }

      try {
        // En modo offline, la subida de archivos no está soportada.
        if (authMode === "guest") {
          // Esta lógica ya está en handleUploadClick, pero la dejamos como doble seguridad.
          return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("wallpaper", file);

        // Usamos la API online para subir el archivo
        const response = await api.updateUserWallpaper(formData);
        
        // Actualizamos el estado del usuario con la nueva lista de fondos y el fondo activo
        const updatedUser = response.user;
        setUser(updatedUser);
        // Sincronizamos la lista local de fondos personalizados
        setCustomWallpapers(updatedUser.customWallpapers);
        setSelectedWallpaper(response.wallpaper);
        toast.success("Fondo de pantalla subido.");
      } catch (error) {
        toast.error("Error al subir la imagen.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Maneja el clic en el botón de subir archivo
  const handleUploadClick = () => {
    // Si el usuario es un invitado, muestra un mensaje y no abre el selector de archivos.
    if (authMode === 'guest') {
      toast.error(
        (t) => (
          <span>
            Solo los usuarios registrados pueden subir fondos. ¡
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
                toast.dismiss(t.id);
              }}
              style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Inicia sesión
            </a> para personalizar tu espacio!
          </span>
        )
      );
    } else if (customWallpapers.length >= 4) {
      // Comprobación del límite de wallpapers ANTES de abrir el explorador de archivos.
      toast.error(
        "Has alcanzado el límite de 4 fondos personalizados. Por favor, elimina uno para poder subir otro.",
        { duration: 5000 }
      );
    } else {
      fileInputRef.current.click();
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

        // 2. Dispara un evento personalizado para que WallpaperSetter se entere del cambio.
        window.dispatchEvent(new CustomEvent('wallpaperChanged'));

      } catch (e) {
        toast.error("No se pudo guardar el fondo en el navegador.");
        setSelectedWallpaper(originalWallpaper);
      }
    }
  };

  // Paso 1: Inicia el proceso de eliminación abriendo el modal
  const requestDeleteWallpaper = (e, urlToDelete) => {
    e.stopPropagation(); // Evita que se seleccione el fondo al hacer clic en el botón
    setWallpaperToDelete(urlToDelete);
  };

  // Paso 2: Se ejecuta si el usuario confirma la eliminación en el modal
  const confirmDeleteWallpaper = async () => {
    if (!wallpaperToDelete) return;

    const urlToDelete = wallpaperToDelete;
    const originalWallpapers = [...customWallpapers];

    // Cierra el modal de confirmación
    setWallpaperToDelete(null);

    // Actualización optimista: elimina el fondo de la UI inmediatamente
    setCustomWallpapers(current => current.filter(url => url !== urlToDelete));

    try {
      // Llama a la API para eliminar el fondo
      await api.deleteCustomWallpaper(urlToDelete);
      toast.success("Fondo de pantalla eliminado.");
    } catch (error) {
      toast.error("No se pudo eliminar el fondo de pantalla.");
      // Revertir en caso de error
      setCustomWallpapers(originalWallpapers);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="wallpaper-modal-box"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // <-- ¡CAMBIO CLAVE!
      >
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

        </div>

        {/* Contenedor separado para los fondos del usuario */}
        {authMode === 'online' && (
          <>
            <h3 className="custom-wallpapers-title">Tus fondos</h3>
            <div className="wallpaper-grid">
              {/* Renderizamos los fondos personalizados del usuario */}
              {customWallpapers.map((url, index) => (
                <div
                  key={`custom-${index}`}
                  className={`wallpaper-item ${selectedWallpaper === url ? "selected" : ""}`}
                  style={{ backgroundImage: `url(${url})` }}
                  onClick={() => handlePredefinedSelect(url)}
                >
                  <button
                    className="delete-wallpaper-btn"
                    onClick={(e) => requestDeleteWallpaper(e, url)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  <div className="selection-checkmark"><i className="fas fa-check"></i></div>
                </div>
              ))}

              {/* Botón de agregar wallpaper */}
              <div className="wallpaper-item upload-placeholder" onClick={handleUploadClick}>
                {isUploading ? <span className="spinner-small"></span> : <i className="fas fa-plus"></i>}
              </div>
            </div>
          </>
        )}

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* Modal de confirmación para eliminar el fondo */}
        <ConfirmationModal
          isOpen={!!wallpaperToDelete}
          onConfirm={confirmDeleteWallpaper}
          onCancel={() => setWallpaperToDelete(null)}
          title="Eliminar Fondo de Pantalla"
          message="¿Estás seguro de que quieres eliminar este fondo de pantalla? Esta acción no se puede deshacer."
        />
      </div>
    </div>
  );
};

export default WallpaperModal;
