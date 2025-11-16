import React, { useEffect, useRef, useMemo, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

const ColumnOptionsDropdown = ({
  container,
  position,
  onClose,
  onRename,
  onDelete,
  onColorChange,
}) => {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 }); // Inicia invisible

  const columnColors = [
    '#df1e1d', '#ff670b', '#5C6BC0', '#42A5F5', // Rojo, Púrpura, Índigo, Azul
    '#26A69A', '#66BB6A', '#a66242', '#AB47BC', // Teal, Verde, Amarillo, Naranja
    '#9E9E9E', '#ffc600', '#EC407A', '#ff70a6'  // Gris, Cian, Rosa, Verde Lima
  ];
  
  // Hook para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Usamos useLayoutEffect para calcular la posición después de que el DOM se haya renderizado
  // pero antes de que el navegador pinte. Esto evita parpadeos.
  useLayoutEffect(() => {
    if (position && container && dropdownRef.current) {
      const containerRect = container.getBoundingClientRect();
      const dropdownWidth = dropdownRef.current.offsetWidth;

      // Calculamos 'top' relativo al contenedor: (bottom del botón - top del contenedor) + scroll actual + margen
      const relativeTop = position.bottom - containerRect.top + container.scrollTop + 5;

      // Calculamos 'left' para alinear el borde derecho del dropdown con el borde derecho del botón.
      // (Posición X del borde derecho del botón relativa al contenido) - (ancho del dropdown)
      const relativeLeft = 
        (position.right - containerRect.left + container.scrollLeft) - dropdownWidth;

      setStyle({
        position: 'absolute',
        top: `${relativeTop}px`,
        left: `${relativeLeft}px`,
      });
    }
  }, [position, container]);

  // Usamos un Portal para renderizar el dropdown en el contenedor principal
  return ReactDOM.createPortal(
    <div ref={dropdownRef} className="column-options-dropdown" style={style}>
      <div className="column-option" onClick={onRename}>Renombrar columna</div>
      <hr className="dropdown-divider" />
      <div className="column-option-label">Cambiar color</div>
      <div className="color-palette-container">
        {columnColors.map(color => (
          <div
            key={color}
            className="color-swatch"
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
          />
        ))}
      </div>
      <hr className="dropdown-divider" />
      <div className="column-option" onClick={onDelete}>Eliminar columna</div>
    </div>,
    container // El contenedor del portal ahora es el div .task-board-main
  );
};

export default ColumnOptionsDropdown;