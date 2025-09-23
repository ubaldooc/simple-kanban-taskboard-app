import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useTaskboardContext } from '../context/TaskboardContext';

const ANIMATION_DURATION = 400;

export const useTaskboardDnd = () => {
  const {
    updateActiveBoard,
    setExitingItemIds,
    deleteCard,
    reorderCards,
    reorderColumns,
  } = useTaskboardContext();

  const [active, setActive] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === "Card" || active.data.current?.type === "Column") {
      setIsDragging(true);
      setActive(active);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setIsOverDeleteZone(over.id === 'delete-zone');

    const isActiveACard = active.data.current?.type === 'Card';
    if (!isActiveACard) return;

    // Lógica para mover una tarjeta sobre otra columna o tarjeta
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverACard = over.data.current?.type === 'Card';

    if (isOverAColumn || isOverACard) {
      const overColumnId = isOverAColumn ? over.id : over.data.current.card.column;

      updateActiveBoard(board => {
        const activeIndex = board.cards.findIndex(c => c.id === active.id);
        const overIndex = isOverACard ? board.cards.findIndex(c => c.id === over.id) : board.cards.length;

        // Si la tarjeta se mueve a una columna diferente
        if (board.cards[activeIndex].column !== overColumnId) {
          let newCards = [...board.cards];
          newCards[activeIndex] = { ...newCards[activeIndex], column: overColumnId }; // Actualiza la columna

          // Mueve la tarjeta a la nueva posición en el array general de tarjetas
          const newIndex = isOverACard ? overIndex : board.cards.length - 1;
          
          return { ...board, cards: arrayMove(newCards, activeIndex, newIndex) };
        }

        // Si se mueve dentro de la misma columna y sobre otra tarjeta
        const isOverDifferentCard = isOverACard && active.id !== over.id;
        if (isOverDifferentCard && board.cards[activeIndex].column === board.cards[overIndex].column) {
          return { ...board, cards: arrayMove(board.cards, activeIndex, overIndex) };
        }
        return board;
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActive(null);
    setIsDragging(false);
    setIsOverDeleteZone(false);

    if (!over) return;

    const activeType = active.data.current?.type;

    // --- Manejo de eliminación de tarjetas ---
    if (over.id === 'delete-zone' && active.data.current?.type === 'Card') {
      setExitingItemIds(prev => [...prev, active.id]);
      setTimeout(() => deleteCard(active.id), ANIMATION_DURATION);
      return;
    }

    if (active.id === over.id) return;

    // --- Manejo de reordenamiento de COLUMNAS ---
    if (activeType === 'Column') {
      // La lógica de reordenamiento de columnas se maneja en el componente BoardSelector (para el dropdown)
      // y se actualiza de forma optimista en handleDragOver. Aquí solo persistimos.
      reorderColumns(active.data.current.sortable.index, over.data.current.sortable.index); // Persiste el orden final
    }

    // --- Manejo de reordenamiento de TARJETAS ---
    if (activeType === 'Card') {
      // Para reordenar las tarjetas, simplemente manda una peticion para el backend para guardar
      // las tarjetas.
      // La lógica de reordenamiento ya se aplicó de forma optimista en handleDragOver.
      // Aquí llamamos a la función que persiste los cambios en el backend.
      reorderCards();
    }
  };

  return {
    active,
    isDragging,
    isOverDeleteZone,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};