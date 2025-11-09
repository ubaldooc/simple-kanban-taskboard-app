import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const WallpaperSetter = () => {
  const { user, authMode, isAuthLoading } = useAuth();
  // Estado local para forzar un re-renderizado cuando el evento ocurra.
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const applyWallpaper = () => {
    const defaultWallpaper = "https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp";
    let finalWallpaperUrl = defaultWallpaper;

    if (authMode === "online" && user?.wallpaper) {
      finalWallpaperUrl = user.wallpaper;
    } else if (authMode === "guest") {
      const guestData = JSON.parse(localStorage.getItem("taskboardData")) || {};
      finalWallpaperUrl = guestData.preferences?.wallpaper || defaultWallpaper;
    }
    document.body.style.backgroundImage = `url(${finalWallpaperUrl})`;
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    applyWallpaper();

    // Función que se ejecutará cuando el evento 'wallpaperChanged' sea disparado.
    const handleWallpaperChange = () => {
      console.log("Evento 'wallpaperChanged' detectado. Aplicando nuevo fondo.");
      applyWallpaper();
    };

    // Añadimos el listener para escuchar el evento.
    window.addEventListener('wallpaperChanged', handleWallpaperChange);

    // Limpiamos el listener cuando el componente se desmonte para evitar fugas de memoria.
    return () => {
      window.removeEventListener('wallpaperChanged', handleWallpaperChange);
    };
  }, [user, authMode, isAuthLoading]);

  return null; // Este componente no renderiza nada
};

export default WallpaperSetter;
