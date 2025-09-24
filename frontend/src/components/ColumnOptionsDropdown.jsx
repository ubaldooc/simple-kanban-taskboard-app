import React, { useEffect, useRef, useMemo } from 'react';
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

  const columnColors = [
    '#EF5350', '#AB47BC', '#5C6BC0', '#42A5F5',
    '#26A69A', '#66BB6A', '#FFEE58', '#FF7043'
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

  // Calculamos el estilo de posicionamiento relativo al contenedor (.task-board-main)
  const style = useMemo(() => {
    if (!position || !container) return {};

    const containerRect = container.getBoundingClientRect();

    // 'position' contiene las coordenadas del botón de opciones relativas al viewport.
    // 'containerRect' contiene las coordenadas del .task-board-main relativas al viewport.

    // Calculamos 'top' relativo al contenedor: (bottom del botón - top del contenedor) + scroll actual + margen
    const relativeTop = position.bottom - containerRect.top + container.scrollTop + 5;
    
    // Calculamos 'left' relativo al contenedor.
    // (Posición X del botón relativa al viewport - Posición X del contenedor relativa al viewport) + scroll horizontal.
    const relativeLeft = (position.left - containerRect.left) + container.scrollLeft;

    return { position: 'absolute', top: `${relativeTop}px`, left: `${relativeLeft}px` };
  }, [position, container]);

  // Usamos un Portal para renderizar el dropdown en el body
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