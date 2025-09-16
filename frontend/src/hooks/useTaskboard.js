import { useState, useEffect, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

// --- Helper Functions ---

// Function to get initial state from localStorage
const getInitialState = (key, defaultValue) => {
  const savedState = localStorage.getItem(key);
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// --- Initial Data ---

const initialBoardsData = () => {
  const savedBoards = getInitialState('taskboards', null);
  if (savedBoards && savedBoards.length > 0) {
    return savedBoards;
  }
  return [{
    id: `board-${crypto.randomUUID()}`,
    title: 'Mi Primer Tablero',
    columns: [
      { id: 'ideas', title: 'Ideas', color: '#AB47BC' },
      { id: 'todo', title: 'To Do', color: '#42A5F5' },
      { id: 'in-progress', title: 'In Progress', color: '#FF7043' },
      { id: 'done', title: 'Done', color: '#66BB6A' },
    ],
    cards: [
      { id: '1', title: '¡Bienvenido a tu nuevo tablero!', column: 'ideas' },
      { id: '2', title: 'Arrastra esta tarjeta a "To Do"', column: 'ideas' },
    ],
  }];
};

export const useTaskboard = () => {
  // --- State Management ---
  const [boards, setBoards] = useState(initialBoardsData);
  const [activeBoardId, setActiveBoardIdState] = useState(() => {
    // 1. Intentar obtener el último ID activo desde localStorage
    const lastActiveBoardId = localStorage.getItem('lastActiveBoardId');
    if (lastActiveBoardId) {
      return lastActiveBoardId;
    }
    // 2. Si no hay, usar el ID del primer tablero como predeterminado
    const savedBoards = getInitialState('taskboards', []); // Reutilizamos la lógica existente
    return savedBoards[0]?.id || null; // Si no hay tableros, será null
  });

  const [editingCardId, setEditingCardId] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [newBoardIdToEdit, setNewBoardIdToEdit] = useState(null);
  const [exitingItemIds, setExitingItemIds] = useState([]);

  // --- Derived State ---
  const activeBoard = boards.find(b => b.id === activeBoardId);
  const columns = activeBoard ? activeBoard.columns : [];
  const cards = activeBoard ? activeBoard.cards : [];

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('taskboards', JSON.stringify(boards));
  }, [boards]);

  useEffect(() => {
    if (activeBoard) {
      document.title = `${activeBoard.title} - Taskboard`;
    }
  }, [activeBoard]);

  // Efecto para validar el activeBoardId cuando los tableros cambian
  useEffect(() => {
    if (boards.length > 0) {
      const boardExists = boards.some(b => b.id === activeBoardId);
      // Si el tablero activo no existe (p. ej. fue eliminado), o no hay ninguno seleccionado
      if (!boardExists) {
        // Selecciona el primero de la lista como fallback
        setActiveBoardIdState(boards[0].id);
        // No guardamos este cambio en localStorage para no sobreescribir la última selección del usuario
        // si solo fue una eliminación temporal. El siguiente setActiveBoardId explícito lo hará.
      }
    } else {
      // Si no hay tableros, el ID activo debe ser null
      setActiveBoardIdState(null);
    }
  }, [boards, activeBoardId]); // Se ejecuta si los tableros o el ID activo cambian

  // --- Wrappers para actualizar estado y localStorage ---
  const setActiveBoardId = (id) => {
    setActiveBoardIdState(id);
    localStorage.setItem('lastActiveBoardId', id);
  };

  // --- Helper to update the active board ---
  const updateActiveBoard = (updater) => {
    setBoards(prevBoards => prevBoards.map(board => board.id === activeBoardId ? updater(board) : board));
  };

  // --- Board Management ---
  const addBoard = () => {
    const newBoard = {
      id: `board-${crypto.randomUUID()}`,
      title: 'Nuevo Tablero',
      columns: [
          { id: `col-${crypto.randomUUID()}`, title: 'To Do', color: '#42A5F5' }
      ],
      cards: [],
    };
    setBoards(prevBoards => [...prevBoards, newBoard]);
    setActiveBoardId(newBoard.id);
    setNewBoardIdToEdit(newBoard.id);
  };

  const editBoard = (boardId, newTitle) => {
    if (newTitle && newTitle.trim() !== '') {
      setBoards(prevBoards =>
        prevBoards.map(b => (b.id === boardId ? { ...b, title: newTitle.trim() } : b))
      );
    }
  };

  const reorderBoards = (oldIndex, newIndex) => {
    setBoards(prevBoards => arrayMove(prevBoards, oldIndex, newIndex));
  };

  const requestDeleteBoard = (boardId) => {
    setBoardToDelete(boardId);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      const newBoards = boards.filter(b => b.id !== boardToDelete);
      setBoards(newBoards);
      if (activeBoardId === boardToDelete) {
        setActiveBoardId(newBoards[0]?.id || null);
      }
      setBoardToDelete(null);
    }
  };

  // --- Item Management ---
  const addColumn = () => {
    const newColumn = { id: `col-${crypto.randomUUID()}`, title: '', color: '#8b949e' };
    updateActiveBoard(board => ({ ...board, columns: [...board.columns, newColumn] }));
    setEditingColumnId(newColumn.id);
  };

  const addCard = (columnId) => {
    const newCard = { id: `${crypto.randomUUID()}`, title: '', column: columnId };
    updateActiveBoard(board => ({ ...board, cards: [...board.cards, newCard] }));
    setEditingCardId(newCard.id);
    return newCard.id; // Devolvemos el ID para la lógica de encadenamiento
  };

  const updateCardTitle = (id, newTitle) => {
    updateActiveBoard(board => ({
      ...board,
      cards: board.cards.map(c => c.id === id ? { ...c, title: newTitle } : c)
    }));
  };

  const deleteCard = (id) => {
    updateActiveBoard(board => ({
      ...board,
      cards: board.cards.filter(c => c.id !== id)
    }));
  };

  const updateColumnTitle = (id, newTitle) => {
    updateActiveBoard(board => ({
      ...board,
      columns: board.columns.map(c => c.id === id ? { ...c, title: newTitle } : c)
    }));
  };

  const updateColumnColor = (id, newColor) => {
    updateActiveBoard(board => ({
      ...board,
      columns: board.columns.map(c => c.id === id ? { ...c, color: newColor } : c)
    }));
  };

  const handleDeleteColumnRequest = (columnId) => setColumnToDelete(columnId);

  const confirmDeleteColumn = () => {
    if (columnToDelete) {
      setExitingItemIds(prev => [...prev, columnToDelete]);
      setColumnToDelete(null);
      setTimeout(() => {
        updateActiveBoard(board => ({
          ...board,
          columns: board.columns.filter(col => col.id !== columnToDelete),
          cards: board.cards.filter(card => card.column !== columnToDelete),
        }));
      }, 400);
    }
  };

  return {
    boards,
    activeBoard,
    columns,
    cards,
    activeBoardId,
    setActiveBoardId,
    addBoard,
    editBoard,
    reorderBoards,
    requestDeleteBoard,
    confirmDeleteBoard,
    boardToDelete,
    setBoardToDelete,
    addColumn,
    addCard,
    onAddCard: addCard, // Exportamos addCard con el alias onAddCard
    updateCardTitle,
    deleteCard,
    updateColumnTitle,
    updateColumnColor,
    handleDeleteColumnRequest,
    confirmDeleteColumn,
    columnToDelete,
    setColumnToDelete,
    editingCardId,
    setEditingCardId,
    editingColumnId,
    setEditingColumnId,
    newBoardIdToEdit,
    setNewBoardIdToEdit,
    exitingItemIds,
    setExitingItemIds,
    updateActiveBoard
  };
};