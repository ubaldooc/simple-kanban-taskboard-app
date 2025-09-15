import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskboardContext } from '../context/TaskboardContext.jsx';

const Card = ({ card }) => {
  const {
    updateCardTitle,
    editingCardId,
    setEditingCardId,
    deleteCard,
    onAddCard
  } = useTaskboardContext();
  const isEditingInitial = card.id === editingCardId;
  const [isEditing, setIsEditing] = useState(isEditingInitial);
  const [title, setTitle] = useState(card.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const editableDiv = inputRef.current;
      editableDiv.focus();

      // Mover el cursor al final del contenido
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editableDiv);
      range.collapse(false); // false para colapsar al final
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing]);

  // Sincroniza el estado local del título si el prop cambia desde el padre
  // (por ejemplo, al guardar un título vacío que se convierte en "nueva tarjeta")
  useEffect(() => {
    setTitle(card.title);
  }, [card.title]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'Card', card },
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setEditingCardId(null);
    const trimmedTitle = inputRef.current.innerText.trim();
    if (trimmedTitle === '') {
      deleteCard(card.id);
      // Si era una tarjeta nueva y se cancela, no creamos otra.
    } else {
      updateCardTitle(card.id, trimmedTitle);
      // Si la tarjeta era nueva (título original vacío) y se guardó con éxito, crea la siguiente.
      if (card.title === '') {
        onAddCard(card.column);
      }
    }
  };

  const handleInput = (e) => {
    // No es necesario actualizar el estado 'title' mientras se escribe
    // ya que leeremos el innerText directamente en el blur.
  };

  const handleKeyDown = (e) => {
    // Guardar con Enter, permitir nueva línea con Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita que se inserte un salto de línea
      inputRef.current.blur();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // Aplica la animación si la tarjeta se acaba de crear y la clase de arrastre
      className={`card ${isEditing ? 'card-editing' : ''} ${isEditingInitial ? 'item-enter-animation' : ''} ${isDragging ? 'is-dragging-card' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <div
          ref={inputRef}
          contentEditable={true}
          suppressContentEditableWarning={true} // Necesario en React para contentEditable
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >{title}</div>
      ) : (
        <p>{card.title}</p>
      )}
    </div>
  );
};

export default Card;