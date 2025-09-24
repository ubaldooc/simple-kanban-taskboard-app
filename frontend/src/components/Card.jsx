import React, { useState, useEffect, useRef, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskboardContext } from '../context/TaskboardContext.jsx';

const CardComponent = ({ card }) => {
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

      // Seleccionar todo el texto al entrar en modo de edición
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editableDiv);
      sel?.removeAllRanges();
      sel?.addRange(range);
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
      inputRef.current?.blur(); // Guarda la tarjeta actual
      // Si el título original estaba vacío, es una tarjeta nueva.
      // En ese caso, al presionar Enter, creamos otra tarjeta.
      if (card.title === '') {
        onAddCard(card.column);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // is-dragging-source hace que la tarjeta original se vuelva transparente durante el arrastre
      className={`card ${isEditing ? 'card-editing' : ''} ${isEditingInitial ? 'item-enter-animation' : ''} ${isDragging ? 'is-dragging-source' : ''}`}
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
          spellCheck="false"
        >{title}</div>
      ) : (
        <p>{card.title}</p>
      )}
    </div>
  );
};

// Envolvemos el componente con React.memo para optimizar el rendimiento.
// Evita que la tarjeta se vuelva a renderizar si sus props no han cambiado,
// lo cual es crucial durante las operaciones de arrastrar y soltar.
const Card = memo(CardComponent);
export default Card;