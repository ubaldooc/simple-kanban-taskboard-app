
// para rehacer este

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const WallpaperSetter = ({ guestWallpaper }) => {
  const { user, authMode } = useAuth();

  useEffect(() => {
    const defaultWallpaper = "https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp";
    let finalWallpaperUrl = defaultWallpaper;

    // Caso 1: Modo Online. El wallpaper viene del objeto 'user' en el AuthContext.
    if (authMode === "online" && user?.wallpaper) {
      finalWallpaperUrl = user.wallpaper;
    // Caso 2: Modo Invitado. El wallpaper viene como prop desde App.jsx.
    } else if (authMode === "guest" && guestWallpaper) {
      finalWallpaperUrl = guestWallpaper;
    }

    // Aplica el wallpaper encontrado o el de por defecto.
    document.body.style.backgroundImage = `url(${finalWallpaperUrl})`;
  }, [user, authMode, guestWallpaper]);

  return null; // Este componente no renderiza nada
};

export default WallpaperSetter;




// // Basate en este codigo
// document.addEventListener('DOMContentLoaded', function () {
//   try {
//     const defaultWallpaper = 'https://res.cloudinary.com/drljxouhe/image/upload/v1762161290/wallpaper-0_y7ewia.webp';
//     let finalWallpaperUrl = defaultWallpaper;

//     // 1. Modo Online: Busca el wallpaper en el objeto 'user'.
//     const userDataString = localStorage.getItem('user');
//     if (userDataString) {
//       const user = JSON.parse(userDataString);
//       if (user && user.wallpaper) {
//         finalWallpaperUrl = user.wallpaper;
//       }
//     } else {
//       // 2. Modo Offline (Invitado): Busca el wallpaper en el objeto 'taskboardData'.
//       const guestDataString = localStorage.getItem('taskboardData');
//       if (guestDataString) {
//         const guestData = JSON.parse(guestDataString);
//         if (guestData && guestData.preferences && guestData.preferences.wallpaper) {
//           finalWallpaperUrl = guestData.preferences.wallpaper;
//         }
//       }
//     }

//     // 3. Aplica el wallpaper encontrado o el de por defecto si nada se encontró.
//     document.body.style.backgroundImage = `url(${finalWallpaperUrl})`;
//   } catch (e) {
//     // Si algo falla (ej: localStorage deshabilitado), no se rompe la app.
//     console.error('Error al establecer el wallpaper desde el script inicial:', e);
//   }
// });