import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const WallpaperSetter = () => {
  const { user, authMode } = useAuth();

  useEffect(() => {
    let wallpaperUrl = "/wallpapers/wallpaper-0.jpg"; // URL por defecto

    if (authMode === "online" && user?.wallpaper) {
      wallpaperUrl = user.wallpaper;
    }

    // La URL puede ser relativa (ej: /wallpapers/...) o absoluta (ej: http://res.cloudinary.com/...)
    document.body.style.backgroundImage = `url(${wallpaperUrl})`;
  }, [user, authMode]);

  return null; // Este componente no renderiza nada
};

export default WallpaperSetter;
