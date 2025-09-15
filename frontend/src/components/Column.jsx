import React, { useState, useRef, useEffect } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import Card from './Card.jsx';
import { useTaskboardContext } from '../context/TaskboardContext.jsx';

const Column = ({ column, cards, onToggleOptions }) => {
  const {

    editingColumnId,
    setEditingColumnId,
    updateColumnTitle,
    exitingItemIds,
    onAddCard,
  } = useTaskboardContext();
  const [title, setTitle] = useState(column.title);
  const titleInputRef = useRef(null);
  const optionsButtonRef = useRef(null); // Ref para el botón de opciones
  
  const isEditing = editingColumnId === column.id;

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      const textarea = titleInputRef.current;
      textarea.focus();
      textarea.select();
      // Ajustar altura inicial al contenido
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing]);


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
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    '--column-header-color': column.color || '#888',
  };

  const toggleOptions = (e) => {
    e.stopPropagation();
    const rect = optionsButtonRef.current.getBoundingClientRect();
    // Llama a la función del padre con el ID de la columna y su posición
    onToggleOptions(column.id, rect);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    // Auto-ajustar la altura del textarea
    const textarea = titleInputRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleTitleBlur = () => {
    const finalTitle = title.trim() === '' ? 'Nueva Columna' : title;
    if (column.title !== finalTitle) {
      updateColumnTitle(column.id, finalTitle);
    }
    setEditingColumnId(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita el salto de línea
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(column.title); // Revert changes
      setEditingColumnId(null);
    }
  };

  const handleTitleDoubleClick = () => {
    // No permitir doble clic si ya se está editando otra columna
    if (!editingColumnId) setEditingColumnId(column.id);
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
      <div className="column-header" {...attributes} >
        <div className="column-title-wrapper" onDoubleClick={handleTitleDoubleClick}>
          {isEditing ? (
            <textarea
              ref={titleInputRef}
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
        <i ref={optionsButtonRef} className="fas fa-ellipsis-h column-options" onClick={toggleOptions} {...listeners}></i>
      </div>
      <SortableContext items={cards.map((card) => card.id)}>
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </SortableContext>
      <div className="add-card" onClick={() => onAddCard(column.id)}>
        <i className="fas fa-plus"></i> Add a card
      </div>
    </div>
  );
};

export default Column;