import { useEffect } from 'react';

/**
 * Custom hook para manejar atajos de teclado.
 * @param {Object.<string, function>} hotkeys - Un objeto donde las claves son los atajos (ej. 'ctrl+n') y los valores son las funciones a ejecutar.
 * @param {Array} deps - Dependencias para el useEffect, similar a como funciona en otros hooks.
 */
const useHotkeys = (hotkeys, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignorar atajos si el usuario está escribiendo en un input, textarea, etc.
      const target = event.target;
      const isInputFocused = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey; // metaKey para soporte de Command en Mac
      const shift = event.shiftKey;
      const alt = event.altKey;

      for (const hotkey in hotkeys) {
        const parts = hotkey.toLowerCase().split('+');
        const hotkeyKey = parts.pop();
        
        const hasCtrl = parts.includes('ctrl');
        const hasShift = parts.includes('shift');
        const hasAlt = parts.includes('alt');

        // Si el atajo requiere un modificador, no lo dispares si se está en un input.
        // Si no requiere modificador (ej. 'n'), solo dispáralo si NO se está en un input.
        if (key === hotkeyKey && ctrl === hasCtrl && shift === hasShift && alt === hasAlt) {
          if (!isInputFocused || (isInputFocused && (hasCtrl || hasAlt))) {
            event.preventDefault();
            hotkeys[hotkey]();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys, ...deps]);
};

export default useHotkeys;