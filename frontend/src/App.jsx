import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { TaskboardView } from "./components/TaskboardView.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx"; // Importamos la nueva página
import WallpaperSetter from "./components/WallpaperSetter.jsx";
import { getApiService } from "./services/apiService.js";

function App() {

  // TOFO ESTO DE ABAJO NO SIRVE PORUQE AHORA LEO EL WALLPAPER DESDE EL INDEX.HTML MAS RAPIDO
  // Estado para el wallpaper del modo invitado, gestionado a nivel de App.
  // const [guestWallpaper, setGuestWallpaper] = useState(null);

  // // Carga el wallpaper del invitado desde localStorage al iniciar la app.
  // useEffect(() => {
  //   const api = getApiService("guest");
  //   api.getUserPreferences().then((prefs) => {
  //     if (prefs && prefs.wallpaper) {
  //       setGuestWallpaper(prefs.wallpaper);
  //     }
  //   });
  // }, []); // Se ejecuta solo una vez.

  return (
    <>
      <WallpaperSetter />
      <Routes>
        {/* La ruta principal ahora es pública y muestra el Taskboard */}
        <Route path="/" element={<TaskboardView />}
        />
        {/* La ruta de login sigue siendo pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Nueva ruta para restablecer la contraseña */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </>
  );
}

export default App;
