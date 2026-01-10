import React, { useState, useRef, useEffect, memo } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import Card from './Card.jsx';
import { useTaskboardContext } from '../context/TaskboardContext.jsx';

const ColumnComponent = ({ column, cards, onToggleOptions }) => {
  const {

    editingCardId, // <-- Añadir esta línea
    editingColumnId,
    setEditingColumnId,
    updateColumnTitle,
    exitingItemIds,
    addColumn,
    onAddCard,
    handleDeleteColumnRequest,
    deleteColumn, // Importamos la función de eliminación directa
  } = useTaskboardContext();
  const cardsContainerRef = useRef(null);
  const titleInputRef = useRef(null);
  const optionsButtonRef = useRef(null); // Ref para el botón de opciones
  
  const isEditing = editingColumnId === column.id;

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      const textarea = titleInputRef.current;
      textarea.focus();
      
      // Seleccionar todo el texto al entrar en modo de edición.
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(textarea);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  // Efecto para hacer scroll automático al añadir una nueva tarjeta.
  useEffect(() => {
    // Comprobamos si la tarjeta que se está editando activamente pertenece a esta columna.
    const isNewCardInThisColumn = cards.some(card => card.id === editingCardId && card.column === column.id);

    // Si es una tarjeta nueva en esta columna y el contenedor existe...
    if (isNewCardInThisColumn && cardsContainerRef.current) {
      // Usamos un setTimeout con 0ms. Esto pospone la ejecución del scroll hasta
      // el siguiente ciclo de renderizado del navegador. Para entonces, el DOM
      // se habrá actualizado con la nueva tarjeta y `scrollHeight` tendrá el valor correcto.
      setTimeout(() => {
        const container = cardsContainerRef.current;
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      }, 0);
    }
  }, [cards.length, editingCardId]); // Se ejecuta si cambia el número de tarjetas o la tarjeta en edición.


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

  const handleTitleBlur = () => {
    let finalTitle = titleInputRef.current.innerText.trim();
    if (finalTitle === '') {
      if (cards.length === 0) {
        // Si no hay título Y no hay tarjetas, eliminar la columna directamente
        deleteColumn(column.id);
      } else {
        // Si no hay título pero sí hay tarjetas, asignar título por defecto
        finalTitle = 'Columna';
        if (column.title !== finalTitle) {
          updateColumnTitle(column.id, finalTitle);
        }
      }
    } else {
      // Si hay título, actualizarlo si ha cambiado
      if (column.title !== finalTitle) {
        updateColumnTitle(column.id, finalTitle);
      }
    }
    setEditingColumnId(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita el salto de línea
      titleInputRef.current.blur(); // Llama a handleTitleBlur indirectamente

      // Si es una columna nueva (título original vacío) Y el usuario ha escrito un título,
      // entonces creamos una nueva columna para una experiencia de usuario más fluida.
      // Si el título se deja vacío, no se crea una nueva columna.
      if (column.title === '' && titleInputRef.current.innerText.trim() !== '') {
        addColumn();
      }
    } else if (e.key === 'Escape') {
      if (titleInputRef.current) titleInputRef.current.innerText = column.title;
      setEditingColumnId(null);
    }
  };

  const handleTitleDoubleClick = () => {
    // No permitir doble clic si ya se está editando otra columna
    if (!editingColumnId) setEditingColumnId(column.id);
  };

  // La animación se aplica solo si la columna está en modo edición Y su título original está vacío.
  // Esto diferencia una columna nueva de una existente que se está editando.
  const isNewlyCreatedAnimation = isEditing && column.title === '';
  const isExiting = (exitingItemIds || []).includes(column.id);

  return (
    <div
      ref={setNodeRef} style={style}
      className={`column ${isDragging ? 'is-dragging-column' : ''} ${isEditing ? 'column-editing' : ''} ${
        isNewlyCreatedAnimation ? 'item-enter-animation' : ''
      } ${isExiting ? 'item-exit-animation' : ''}`}>
      <div className="column-header" {...attributes} {...listeners} >
        <div className="column-title-wrapper" onDoubleClick={handleTitleDoubleClick}>
          {isEditing ? ( 
            <div
              ref={titleInputRef}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="column-title-input" 
              spellCheck="false"
            >{column.title}</div>
          ) : (
            <h2>{column.title}</h2>
          )}
          <span className="card-count">{cards.length}</span>
        </div>
        <i ref={optionsButtonRef} className="fas fa-ellipsis-h column-options" onClick={toggleOptions} ></i>
      </div>
      <div className="cards-container" ref={cardsContainerRef}>
        <SortableContext items={cards.map((card) => card.id)}>
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
      <div className="add-card" onClick={() => onAddCard(column.id)}>
        <i className="fas fa-plus"></i> Añadir tarjeta
      </div>
    </div>
  );
};

// Envolvemos el componente con React.memo para optimizar el rendimiento.
// Evita que la columna se vuelva a renderizar innecesariamente durante
// el arrastre de tarjetas en otras columnas.
const Column = memo(ColumnComponent);
export default Column;