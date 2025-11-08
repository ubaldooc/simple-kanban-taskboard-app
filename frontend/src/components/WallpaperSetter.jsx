import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const WallpaperSetter = () => {
  const { user, authMode } = useAuth();
  const [finalAuthMode, setFinalAuthMode] = useState(null);

  useEffect(() => {
    // Espera a que el valor de authMode se estabilice y evita el parpadeo de 2 wallpapers
    const timeout = setTimeout(() => {
      setFinalAuthMode(authMode);
    }, 400); // Ajusta el tiempo según sea necesario

    return () => clearTimeout(timeout); // Limpia el timeout si el componente se desmonta
  }, [authMode]);

  useEffect(() => {
    if (!finalAuthMode) return;

    const defaultWallpaper = "https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp";
    let finalWallpaperUrl = defaultWallpaper;

    if (finalAuthMode === "online" && user?.wallpaper) {
      finalWallpaperUrl = user.wallpaper;
    } else if (finalAuthMode === "guest") {
      const guestData = JSON.parse(localStorage.getItem("taskboardData")) || {};
      finalWallpaperUrl = guestData.preferences?.wallpaper || defaultWallpaper;
    }

    document.body.style.backgroundImage = `url(${finalWallpaperUrl})`;
  }, [user, finalAuthMode]);

  return null; // Este componente no renderiza nada
};

export default WallpaperSetter;

