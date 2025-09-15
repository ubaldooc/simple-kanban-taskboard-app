import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskboardContext } from '../context/TaskboardContext.jsx';

const Card = ({ card }) => {
  const {
    updateCardTitle,
    editingCardId,
    setEditingCardId,
    deleteCard
  } = useTaskboardContext();
  const isEditingInitial = card.id === editingCardId;
  const [isEditing, setIsEditing] = useState(isEditingInitial);
  const [title, setTitle] = useState(card.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const textarea = inputRef.current;
      textarea.focus();
      // Ajustar la altura inicial al contenido
      // Mover el cursor al final del texto
      const len = textarea.value.length;
      textarea.setSelectionRange(len, len);

      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
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
    const trimmedTitle = title.trim();
    if (trimmedTitle === '') {
      deleteCard(card.id);
    } else {
      updateCardTitle(card.id, trimmedTitle);
    }
  };

  const handleChange = (e) => {
    setTitle(e.target.value);
    // Ajustar la altura mientras se escribe
    const textarea = inputRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
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
        <textarea
          ref={inputRef}
          type="text"
          value={title}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <p>{card.title}</p>
      )}
    </div>
  );
};

export default Card;