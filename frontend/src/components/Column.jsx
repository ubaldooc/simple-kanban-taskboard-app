import React, { useState, useRef, useEffect } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card.jsx';

const Column = ({
  column,
  cards,
  onAddCard,
  updateCardTitle,
  editingCardId,
  clearEditingCardId,
  onDeleteColumn,
  editingColumnId,
  setEditingColumnId,
  updateColumnTitle,
  updateColumnColor,
  exitingItemIds,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [title, setTitle] = useState(column.title);
  const titleInputRef = useRef(null);
  const optionsContainerRef = useRef(null);

  const columnColors = [
    '#EF5350', '#AB47BC', '#5C6BC0', '#42A5F5',
    '#26A69A', '#66BB6A', '#FFEE58', '#FF7043'
  ];

  const isEditing = editingColumnId === column.id;

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  // Cerrar popups (opciones o paleta de colores) si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el clic fue fuera del contenedor de opciones, cierra el dropdown.
      if (optionsContainerRef.current && !optionsContainerRef.current.contains(event.target)) {
        setIsOptionsOpen(false);
      }
    };

    // Añadimos el listener solo si el dropdown de opciones está abierto.
    if (isOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Función de limpieza para remover el listener.
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsOpen]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: isEditing,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    '--column-header-color': column.color || '#888',
  };

  const toggleOptions = (e) => {
    // Detenemos la propagación para que dnd-kit no interprete el clic como un inicio de arrastre
    e.stopPropagation();
    setIsOptionsOpen(!isOptionsOpen);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsOptionsOpen(false);
    onDeleteColumn(column.id);
  };

  const handleRenameClick = (e) => {
    e.stopPropagation();
    setEditingColumnId(column.id);
    setIsOptionsOpen(false);
  };

  const handleColorSelect = (color) => {
    updateColumnColor(column.id, color);
    setIsOptionsOpen(false);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    const finalTitle = title.trim() === '' ? 'Nueva Columna' : title;
    if (column.title !== finalTitle) {
      updateColumnTitle(column.id, finalTitle);
    }
    setEditingColumnId(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(column.title); // Revert changes
      setEditingColumnId(null);
    }
  };

  // La animación se aplica solo si la columna está en modo edición Y su título original está vacío.
  // Esto diferencia una columna nueva de una existente que se está editando.
  const isNewlyCreated = isEditing && column.title === '';
  const isExiting = exitingItemIds.includes(column.id);

  return (
    <div
      ref={setNodeRef} style={style}
      className={`column ${isDragging ? 'is-dragging-column' : ''} ${isEditing ? 'column-editing' : ''} ${
        isNewlyCreated ? 'item-enter-animation' : ''
      } ${isExiting ? 'item-exit-animation' : ''}`}>
      <div className="column-header" {...attributes} {...listeners} >
        <div className="column-title-wrapper">
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="column-title-input"
            />
          ) : (
            <h2>{column.title}</h2>
          )}
          <span className="card-count">{cards.length}</span>
        </div>
        <div className="column-options-container" ref={optionsContainerRef}>
          <i className="fas fa-ellipsis-h column-options" onClick={toggleOptions}></i>
          {isOptionsOpen && (
            <div className="column-options-dropdown">
              <div className="column-option" onClick={handleRenameClick}>Renombrar columna</div>
              <hr className="dropdown-divider" />
              <div className="column-option-label">Cambiar color</div>
              <div className="color-palette-container">
                {columnColors.map(color => (
                  <div
                    key={color}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
              <hr className="dropdown-divider" />
              <div className="column-option" onClick={handleDelete}>Eliminar columna</div>
            </div>
          )}
        </div>
      </div>
      <SortableContext items={cards.map((card) => card.id)}>
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            updateCardTitle={updateCardTitle}
            isEditingInitial={card.id === editingCardId}
            clearEditingCardId={clearEditingCardId}
          />
        ))}
      </SortableContext>
      <div className="add-card" onClick={() => onAddCard(column.id)}>
        <i className="fas fa-plus"></i> Add a card
      </div>
    </div>
  );
};

export default Column;