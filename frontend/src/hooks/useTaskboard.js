import { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

// --- Helper Functions ---

export const useTaskboard = () => {
  // --- State Management ---
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardIdState] = useState(() => {
    // 1. Intentar obtener el último ID activo desde localStorage
    const lastActiveBoardId = localStorage.getItem('lastActiveBoardId');
    if (lastActiveBoardId) {
      return lastActiveBoardId;
    }
    // 2. Si no hay, usar el ID del primer tablero como predeterminado
    // El ID se establecerá después de la carga de datos.
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [newBoardIdToEdit, setNewBoardIdToEdit] = useState(null);
  const [exitingItemIds, setExitingItemIds] = useState([]);

  // --- Derived State ---
  const activeBoard = boards.find(b => b.id === activeBoardId);
  const columns = activeBoard ? activeBoard.columns : [];
  const cards = activeBoard?.cards || [];

  // --- Effects ---

  // Cargar datos desde el backend al iniciar
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/boards');
        if (!response.ok) throw new Error('Network response was not ok');
        
        let data = await response.json();

        // Si la base de datos está vacía, crea un tablero por defecto
        if (data.length === 0) {
          // TODO: Crear este tablero por defecto en el backend y volver a fetchear
          // Por ahora, lo creamos en el frontend para demostración.
          data = [{
            id: `board-${crypto.randomUUID()}`,
            title: 'Mi Primer Tablero',
            columns: [
              { id: 'ideas', title: 'Ideas', color: '#AB47BC' },
              { id: 'todo', title: 'To Do', color: '#42A5F5' },
            ],
            cards: [
              { id: '1', title: '¡Bienvenido!', column: 'ideas' },
            ],
          }];
        } else {
          // Transforma los datos del backend (_id) al formato del frontend (id)
          data = data.map(board => ({
            ...board,
            id: board._id,
            columns: board.columns.map(col => ({ ...col, id: col._id })),
            cards: board.cards.map(card => ({ ...card, id: card._id })),
          }));
        }

        setBoards(data);
        // Si no hay un activeBoardId en localStorage, establece el primero de la lista
        if (!localStorage.getItem('lastActiveBoardId')) {
          setActiveBoardId(data[0]?.id || null);
        }
      } catch (error) {
        console.error("Error al cargar los tableros:", error);
        // Podrías establecer un estado de error aquí para mostrarlo en la UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []); // El array vacío asegura que se ejecute solo una vez

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
  const addBoard = async () => {
    // 1. Crear un tablero temporal con un ID único del lado del cliente
    const tempId = `temp-${crypto.randomUUID()}`;
    const newBoardOptimistic = {
      id: tempId,
      title: 'Nuevo Tablero',
      columns: [
        { id: `temp-col-${crypto.randomUUID()}`, title: 'To Do', color: '#42A5F5' }
      ],
      cards: [],
    };

    // 2. Actualización optimista: Añadir el tablero temporal al estado de React
    setBoards(prevBoards => [...prevBoards, newBoardOptimistic]);
    setActiveBoardId(tempId);
    setNewBoardIdToEdit(tempId);

    try {
      // 3. Enviar los datos al backend (sin el ID temporal)
      const newBoardDataForBackend = {
        title: newBoardOptimistic.title,
        columns: newBoardOptimistic.columns.map(({ title, color }) => ({ title, color })),
      };

      const response = await fetch('http://localhost:5001/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBoardDataForBackend),
      });

      if (!response.ok) throw new Error('Error al crear el tablero');

      const createdBoard = await response.json();
      
      // 4. Reemplazar el tablero temporal con el tablero real del backend
      setBoards(prevBoards => prevBoards.map(board => {
        if (board.id === tempId) {
          // Transforma la respuesta del backend al formato del frontend
          return {
            ...createdBoard,
            id: createdBoard._id,
            columns: createdBoard.columns.map(col => ({ ...col, id: col._id })),
            cards: createdBoard.cards || [],
          };
        }
        return board;
      }));

      // 5. Actualizar el ID activo y el ID a editar al ID permanente
      setActiveBoardId(createdBoard._id);
      setNewBoardIdToEdit(createdBoard._id);

    } catch (error) {
      console.error("Error en addBoard:", error);
      // Opcional: Revertir la actualización optimista si falla la llamada a la API
      setBoards(prevBoards => prevBoards.filter(board => board.id !== tempId));
    }
  };

  const editBoard = async (boardId, newTitle) => {
    if (newTitle && newTitle.trim() !== '') {
      const trimmedTitle = newTitle.trim();
      // Actualización optimista en la UI
      setBoards(prevBoards =>
        prevBoards.map(b => (b.id === boardId ? { ...b, title: trimmedTitle } : b))
      );

      try {
        const response = await fetch(`http://localhost:5001/api/boards/${boardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmedTitle }),
        });

        if (!response.ok) throw new Error('Error al actualizar el tablero en el servidor');
      } catch (error) {
        console.error("Error en editBoard:", error);
        // Opcional: Revertir el cambio en la UI si la llamada a la API falla
      }
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
    isLoading,
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