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

    const activeCard = active.data.current.card;

    // --- Lógica para mover una tarjeta sobre otra columna o tarjeta ---
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverACard = over.data.current?.type === 'Card';

    if (isOverAColumn || isOverACard) {
      const overId = over.id;
      const overCard = isOverACard ? over.data.current.card : null;
      const overColumnId = isOverAColumn ? overId : overCard.column;

      // Si la tarjeta activa y la tarjeta sobre la que se arrastra son la misma, no hacer nada.
      if (active.id === overId) return;

      // Actualización optimista del estado
      updateActiveBoard(board => {
        const activeIndex = board.cards.findIndex(c => c.id === active.id);

        // Caso 1: Mover a una columna diferente
        if (activeCard.column !== overColumnId) {
          const overIndex = isOverACard
            ? board.cards.findIndex(c => c.id === overId)
            : board.cards.findIndex(c => c.column === overColumnId) + board.cards.filter(c => c.column === overColumnId).length;

          // Actualiza la columna de la tarjeta activa
          board.cards[activeIndex].column = overColumnId;

          // Mueve la tarjeta en el array
          return { ...board, cards: arrayMove(board.cards, activeIndex, overIndex) };
        }

        // Caso 2: Reordenar dentro de la misma columna
        if (isOverACard && activeCard.column === overCard.column) {
          const overIndex = board.cards.findIndex(c => c.id === overId);
          // Si los índices son diferentes, reordena
          if (activeIndex !== overIndex) {
            return { ...board, cards: arrayMove(board.cards, activeIndex, overIndex) };
          }
        }

        // Si no se cumple ninguna condición, devuelve el estado sin cambios
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