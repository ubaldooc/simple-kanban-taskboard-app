import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
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

  // Estado para guardar las dimensiones del elemento arrastrado
  const [dragItemStyles, setDragItemStyles] = useState(null);

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === "Card" || active.data.current?.type === "Column") {
      setIsDragging(true);
      setActive(active);

      // Capturamos el tamaño del nodo DOM original
      const node = active.data.current?.sortable?.node?.current;
      if (node) {
        setDragItemStyles({
          width: node.offsetWidth,
          height: node.offsetHeight,
        });
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    setIsOverDeleteZone(over.id === 'delete-zone');

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // --- Lógica para reordenar COLUMNAS mientras se arrastran ---
    if (activeType === 'Column' && overType === 'Column' && active.id !== over.id) {
      updateActiveBoard(board => {
        const oldIndex = board.columns.findIndex(c => c.id === active.id);
        const newIndex = board.columns.findIndex(c => c.id === over.id);

        // Si los índices son válidos, mueve la columna en el estado
        if (oldIndex !== -1 && newIndex !== -1) {
          return {
            ...board,
            columns: arrayMove(board.columns, oldIndex, newIndex),
          };
        }
        return board;
      });
    }

    // --- Lógica para mover una tarjeta sobre otra columna o tarjeta ---
    if (activeType !== 'Card') return;
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
        const overIndex = board.cards.findIndex(c => c.id === overId);

        // Si no se encuentra la tarjeta sobre la que se arrastra, no hacer nada.
        // Esto puede pasar si se arrastra sobre una columna vacía, lo manejaremos de otra forma.
        if (overIndex === -1) {
          // Si se arrastra sobre una columna (y no una tarjeta), actualiza la columna de la tarjeta activa.
          if (isOverAColumn && board.cards[activeIndex].column !== overColumnId) {
            board.cards[activeIndex].column = overColumnId;
          }
          return board; // Devuelve el tablero con la columna actualizada si es el caso.
        }

        if (board.cards[activeIndex].column !== overColumnId) {
          // Actualiza la columna de la tarjeta activa en el estado
          board.cards[activeIndex].column = overColumnId;
        }

        // Si se arrastra sobre otra tarjeta, reordena.
        if (activeIndex !== overIndex) {
          return { ...board, cards: arrayMove(board.cards, activeIndex, overIndex) };
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
    setDragItemStyles(null); // Limpiamos los estilos

    if (!over) return;

    const activeType = active.data.current?.type;

    // --- Manejo de eliminación de tarjetas ---
    if (over.id === 'delete-zone' && active.data.current?.type === 'Card') {
      setExitingItemIds(prev => [...prev, active.id]);
      setTimeout(() => deleteCard(active.id), ANIMATION_DURATION);
      return;
    }

    // --- Manejo de reordenamiento de COLUMNAS ---
    if (activeType === 'Column') {
      // Solo persistimos si la columna realmente cambió de posición.    
      reorderColumns();
    }

    // --- Manejo de reordenamiento de TARJETAS ---
    if (activeType === 'Card') {
      // La lógica de reordenamiento visual ya se aplicó de forma optimista en `handleDragOver`.
      // Aquí, sin importar si `active.id` y `over.id` son iguales,
      // siempre llamamos a `reorderCards` para que el estado actual de la UI (que es el correcto)
      // se guarde en el backend.
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
    dragItemStyles, // Exportamos los estilos
  };
};