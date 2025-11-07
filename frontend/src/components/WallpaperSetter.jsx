import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const WallpaperSetter = ({ guestWallpaper }) => {
  const { user, authMode } = useAuth();

  useEffect(() => {
    let wallpaperUrl = "https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp"; // URL por defecto

    // Si estamos online, usamos el wallpaper del objeto user.
    if (authMode === "online" && user?.wallpaper) {
      wallpaperUrl = user.wallpaper;
      // Si estamos en modo invitado, usamos el wallpaper que nos pasa App.jsx.
    } else if (authMode === "guest" && guestWallpaper) {
      wallpaperUrl = guestWallpaper;
    }

    // La URL puede ser relativa (ej: /wallpapers/...) o absoluta (ej: http://res.cloudinary.com/...)
    document.body.style.backgroundImage = `url(${wallpaperUrl})`;
  }, [user, authMode, guestWallpaper]);

  return null; // Este componente no renderiza nada
};

export default WallpaperSetter;
