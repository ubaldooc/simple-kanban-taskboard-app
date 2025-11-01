import React from "react";
import { Routes, Route } from "react-router-dom";
import { TaskboardView } from "./components/TaskboardView.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import WallpaperSetter from "./components/WallpaperSetter.jsx";

function App() {
  return (
    <>
      <WallpaperSetter />
      <Routes>
        {/* La ruta principal ahora es pública y muestra el Taskboard */}
        <Route path="/" element={<TaskboardView />} />
        {/* La ruta de login sigue siendo pública */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  );
}

export default App;
