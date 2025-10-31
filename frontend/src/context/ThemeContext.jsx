import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 1. Estado para el tema, inicializado desde localStorage o por defecto 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  // 2. Efecto para aplicar la clase al body y guardar en localStorage
  useEffect(() => {
    const body = document.body;
    // Limpiamos clases anteriores y añadimos la actual
    body.classList.remove("light", "dark");
    body.classList.add(theme);
    // Guardamos la preferencia
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 3. Función para cambiar el tema
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
