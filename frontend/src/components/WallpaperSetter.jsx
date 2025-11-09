import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Background from "./Background";

const WallpaperSetter = () => {
  const { user, authMode, isAuthLoading } = useAuth();
  const [backgrounds, setBackgrounds] = useState([null, null]);
  const [activeLayer, setActiveLayer] = useState(0);
  // Estado "gatillo" para forzar una actualización cuando el evento de localStorage ocurra.
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Este efecto se encarga de escuchar el evento personalizado.
    const handleWallpaperChange = () => {
      // Cuando el evento ocurre, cambiamos el valor del "gatillo" para forzar un re-render.
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('wallpaperChanged', handleWallpaperChange);

    // Limpiamos el listener cuando el componente se desmonte.
    return () => window.removeEventListener('wallpaperChanged', handleWallpaperChange);
  }, []); // El array vacío asegura que este efecto se configure solo una vez.

  useEffect(() => {
    if (isAuthLoading) return;

    const defaultWallpaper = "https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp";
    let finalWallpaperUrl = defaultWallpaper;

    if (authMode === "online" && user?.wallpaper) {
      finalWallpaperUrl = user.wallpaper;
    } else if (authMode === "guest") {
      const guestData = JSON.parse(localStorage.getItem("taskboardData")) || { preferences: {} };
      finalWallpaperUrl = guestData.preferences?.wallpaper || defaultWallpaper;
    }

    // Comprueba si el nuevo fondo es diferente al actual
    if (finalWallpaperUrl !== backgrounds[activeLayer]) {
      const nextLayer = 1 - activeLayer; // Alterna entre 0 y 1
      const newBackgrounds = [...backgrounds];
      newBackgrounds[nextLayer] = finalWallpaperUrl;

      setBackgrounds(newBackgrounds);
      setActiveLayer(nextLayer);
    }
  }, [user, authMode, isAuthLoading, updateTrigger]); // <-- Añadimos updateTrigger a las dependencias

  return (
    <>
      {backgrounds[0] && <Background url={backgrounds[0]} isActive={activeLayer === 0} />}
      {backgrounds[1] && <Background url={backgrounds[1]} isActive={activeLayer === 1} />}
    </>
  );
};

export default WallpaperSetter;
