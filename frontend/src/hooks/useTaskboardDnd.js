import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useTaskboardContext } from '../context/TaskboardContext';

const ANIMATION_DURATION = 400;

export const useTaskboardDnd = () => {
  const {
    updateActiveBoard,
    setExitingItemIds,
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
    setIsOverDeleteZone(over?.id === 'delete-zone');
    if (!over || active.id === over.id) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverACard = over.data.current?.type === 'Card';

    if (isActiveACard) {
      updateActiveBoard(board => {
        const activeIndex = board.cards.findIndex(c => c.id === active.id);
        let overIndex;

        if (isOverAColumn) {
          board.cards[activeIndex].column = over.id;
          return { ...board, cards: arrayMove(board.cards, activeIndex, activeIndex) };
        }
        
        if (isOverACard) {
          overIndex = board.cards.findIndex(c => c.id === over.id);
          if (board.cards[activeIndex].column !== board.cards[overIndex].column) {
            board.cards[activeIndex].column = board.cards[overIndex].column;
          }
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

    if (over.id === 'delete-zone' && active.data.current?.type === 'Card') {
      setExitingItemIds(prev => [...prev, active.id]);
      setTimeout(() => {
        updateActiveBoard(board => ({
          ...board,
          cards: board.cards.filter(card => card.id !== active.id)
        }));
      }, ANIMATION_DURATION);
      return;
    }

    if (active.id !== over.id && active.data.current?.type === 'Column') {
      updateActiveBoard(board => {
        const oldIndex = board.columns.findIndex(c => c.id === active.id);
        const newIndex = board.columns.findIndex(c => c.id === over.id);
        return { ...board, columns: arrayMove(board.columns, oldIndex, newIndex) };
      });
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