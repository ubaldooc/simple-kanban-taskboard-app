import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

  // Carga los datos completos (columnas y tarjetas) de un tablero específico
  const fetchBoardDetails = async (boardId) => {
    if (!boardId) return;

    try {
      const response = await fetch(`http://localhost:5001/api/boards/${boardId}`);
      if (!response.ok) throw new Error('No se pudieron cargar los detalles del tablero.');

      const detailedBoard = await response.json();

      // Actualiza el tablero específico en el estado con sus datos completos
      setBoards(prevBoards => prevBoards.map(board =>
        board.id === detailedBoard._id
          ? {
              ...board, // Mantiene el 'id' del frontend
              columns: detailedBoard.columns.map(col => ({ ...col, id: col._id })),
              cards: detailedBoard.cards || [],
            }
          : board
      ));
    } catch (error) {
      console.error("Error al cargar detalles del tablero:", error);
      toast.error(error.message);
    }
  };

  // Cargar datos desde el backend al iniciar
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/boards/list');
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
            id: board._id, // El _id viene por defecto
            // Inicializamos columns y cards como arrays vacíos. Se cargarán bajo demanda.
            columns: [],
            cards: [],
          }));
        }

        setBoards(data);

        const lastActiveId = localStorage.getItem('lastActiveBoardId');
        const idToLoad = lastActiveId && data.some(b => b.id === lastActiveId) ? lastActiveId : data[0]?.id;

        // Si no hay un activeBoardId en localStorage, establece el primero de la lista
        if (idToLoad) {
          setActiveBoardId(idToLoad);
          fetchBoardDetails(idToLoad); // Carga los detalles del tablero activo
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
    // Cargar detalles cuando el tablero activo cambia y no tiene columnas cargadas
    if (activeBoard && activeBoard.columns.length === 0) {
      // Evita recargar si es un tablero nuevo temporal
      if (!activeBoard.id.startsWith('temp-')) {
        fetchBoardDetails(activeBoard.id);
      }
    }
  }, [activeBoardId]); // Se dispara cuando cambia el ID del tablero activo

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
      title: 'Nuevo Tablero...', // Título temporal
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
        title: 'Nuevo Tablero', // Título por defecto en el backend
        // Enviamos las columnas que queremos crear
        columns: [{ title: 'To Do', color: '#42A5F5' }],
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
      // Inicia la edición del título del nuevo tablero
      setNewBoardIdToEdit(createdBoard._id);

    } catch (error) {
      console.error("Error en addBoard:", error);
      toast.error('No se pudo crear el tablero.');
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




  // FUNCION PARA CAMBIAR EL ORDEN DE LOS BOARDS EN EL DROPDOWN DE BOARDS
  const reorderBoards = async (oldIndex, newIndex) => {
    const originalBoards = boards; // Guardar una copia del estado original
    // 1. Actualización optimista en la UI
    const newOrderedBoards = arrayMove(boards, oldIndex, newIndex);
    setBoards(newOrderedBoards);

    // 2. Preparar los datos para el backend (solo los IDs en el nuevo orden)
    const boardIds = newOrderedBoards.map(board => board.id);

    try {
      // 3. Enviar el nuevo orden al backend
      const response = await fetch('http://localhost:5001/api/boards/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardIds }),
      });

      // console.log(boardIds);
      

      if (!response.ok) {
        throw new Error('Error al guardar el orden de los tableros en el servidor.');
      }
      toast.success('Orden de tableros guardado.');
    } catch (error) {
      console.error("Error en reorderBoards:", error);
      // Reversión: Si la API falla, podrías revertir al orden original.
      // Por simplicidad, aquí solo mostramos un error.
      toast.error('No se pudo guardar el nuevo orden.');
      setBoards(originalBoards); // Revertir al estado anterior guardado
    }
  };



  // ELIMINAR BOARDS, TABLEROS. 
  const requestDeleteBoard = (boardId) => {
    setBoardToDelete(boardId);
  };

  const confirmDeleteBoard = async () => {
    if (boardToDelete) {
      const originalBoards = boards; // Guarda el estado original para poder revertirlo
      const boardIdToDelete = boardToDelete; // Guarda el ID antes de limpiar el estado
      
      // Actualización optimista: elimina el tablero de la UI inmediatamente para una mejor UX
      setBoards(prevBoards => prevBoards.filter(b => b.id !== boardIdToDelete));
      setBoardToDelete(null);
      
      try {
        const response = await fetch(`http://localhost:5001/api/boards/${boardIdToDelete}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          // Si la API falla, la respuesta no será 'ok'. Lanza un error para ir al catch.
          let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
          // let errorMessage = `No se pudo elimina el tablero revisa tu conexion a internet`;
          // Intenta leer el cuerpo del error solo si es JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
          throw new Error(errorMessage);
        }
        toast.success('Tablero eliminado correctamente.');
        // Si todo va bien, la UI ya está actualizada, no se necesita hacer nada más.
      } catch (error) {
        console.error("Error en confirmDeleteBoard:", error);
        // Reversión: Si la API falla, restaura los tableros al estado original.
        toast.error(error.message || 'No se pudo eliminar el tablero.');
        setBoards(originalBoards);
      }
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