import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const ColumnOptionsDropdown = ({
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

  const style = {
    position: 'absolute',
    top: `${position.bottom + 5}px`, // 5px debajo del botón
    left: `${position.right - 200}px`, // Alinear a la derecha (ancho aprox. 200px)
  };

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
    document.body // El contenedor del portal
  );
};

export default ColumnOptionsDropdown;