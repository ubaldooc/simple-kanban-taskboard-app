import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { TaskboardView } from "./components/TaskboardView.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import WallpaperSetter from "./components/WallpaperSetter.jsx";
import { getApiService } from "./services/apiService.js";

function App() {
  // Estado para el wallpaper del modo invitado, gestionado a nivel de App.
  const [guestWallpaper, setGuestWallpaper] = useState(null);

  // Carga el wallpaper del invitado desde localStorage al iniciar la app.
  useEffect(() => {
    const api = getApiService("guest");
    api.getUserPreferences().then((prefs) => {
      if (prefs && prefs.wallpaper) {
        setGuestWallpaper(prefs.wallpaper);
      }
    });
  }, []); // Se ejecuta solo una vez.

  return (
    <>
      <WallpaperSetter guestWallpaper={guestWallpaper} />
      <Routes>
        {/* La ruta principal ahora es pública y muestra el Taskboard */}
        <Route
          path="/"
          element={<TaskboardView setGuestWallpaper={setGuestWallpaper} />}
        />
        {/* La ruta de login sigue siendo pública */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  );
}

export default App;
