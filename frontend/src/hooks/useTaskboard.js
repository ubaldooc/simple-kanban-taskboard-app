import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { arrayMove } from '@dnd-kit/sortable';

// --- Helper Functions ---

export const useTaskboard = () => {
  // --- State Management ---
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardIdState] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [newBoardIdToEdit, setNewBoardIdToEdit] = useState(null);
  const [exitingItemIds, setExitingItemIds] = useState([]);

  // --- Derived State ---    GUARDAR ESTADO
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

      // --- ¡Solución! Ordenar las tarjetas en el frontend ---
      // El backend devuelve un array plano de tarjetas. Lo ordenamos por su campo 'order'.
      const sortedCards = (detailedBoard.cards || []).sort((a, b) => a.order - b.order);

      // Actualiza el tablero específico en el estado con sus datos completos
      setBoards(prevBoards => prevBoards.map(board =>
        board.id === detailedBoard._id
          ? {
              ...board, // Mantiene el 'id' del frontend
              columns: detailedBoard.columns.map(col => ({ ...col, id: col._id })),
              cards: sortedCards.map(card => ({ ...card, id: card._id })),
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
      setIsLoading(true);
      try {
        // Hacemos las dos peticiones en paralelo para más eficiencia
        const [boardsResponse, prefsResponse] = await Promise.all([
          fetch('http://localhost:5001/api/boards/list'),
          fetch('http://localhost:5001/api/user/preferences')
        ]);

        if (!boardsResponse.ok) throw new Error('No se pudo cargar la lista de tableros.');
        if (!prefsResponse.ok) throw new Error('No se pudieron cargar las preferencias del usuario.');
        
        let boardsData = await boardsResponse.json();
        const prefsData = await prefsResponse.json();

        // Si la base de datos está vacía, crea un tablero por defecto
        if (boardsData.length === 0) {
          // TODO: Crear este tablero por defecto en el backend y volver a fetchear
          // Por ahora, lo creamos en el frontend para demostración.
          boardsData = [{
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
          boardsData = boardsData.map(board => ({
            ...board,
            id: board._id, // El _id viene por defecto
            // Inicializamos columns y cards como arrays vacíos. Se cargarán bajo demanda.
            columns: [],
            cards: [],
          }));
        }

        setBoards(boardsData);

        const lastActiveId = prefsData.lastActiveBoardId;
        const idToLoad = lastActiveId && boardsData.some(b => b.id === lastActiveId) ? lastActiveId : boardsData[0]?.id;

        // Establece el tablero activo y carga sus detalles
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
        const fallbackId = boards[0]?.id || null;
        setActiveBoardId(fallbackId);
      }
    } else {
      // Si no hay tableros, el ID activo debe ser null
      setActiveBoardIdState(null);
    }
  }, [boards, activeBoardId]); // Se ejecuta si los tableros o el ID activo cambian

  // --- Wrappers para actualizar estado y guardar en DB ---
  const setActiveBoardId = (id) => {
    setActiveBoardIdState(id);
    // Guarda la preferencia en el backend en lugar de localStorage
    fetch('http://localhost:5001/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastActiveBoardId: id }),
    }).catch(error => {
      console.error('No se pudo guardar la preferencia del tablero activo:', error);
    });
  };

  // --- Helper to update the active board ---
  const updateActiveBoard = (updater) => {
    setBoards(prevBoards => prevBoards.map(board => board.id === activeBoardId ? updater(board) : board));
  };



  


  // --- Board Management ---


  // AGREGAR BOARDS
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



    // EDITAR BOARD TITULO
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




  // REORDENAR BOARDS EN DROPDOWN
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



  // REORDENAR COLUMNAS
  const reorderColumns = async (oldIndex, newIndex) => {
    if (!activeBoardId) return;

    const originalColumns = activeBoard.columns;
    // 1. Actualización optimista
    const reorderedColumns = arrayMove(originalColumns, oldIndex, newIndex);
    updateActiveBoard(board => ({ ...board, columns: reorderedColumns }));

    // 2. Preparar datos y llamar a la API
    const columnIds = reorderedColumns.map(c => c.id);
    try {
      const response = await fetch(`http://localhost:5001/api/boards/${activeBoardId}/reorder-columns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnIds }),
      });
      if (!response.ok) throw new Error('No se pudo guardar el orden de las columnas.');
    } catch (error) {
      toast.error(error.message);
      // Revertir si falla
      updateActiveBoard(board => ({ ...board, columns: originalColumns }));
    }
  };




  // REORDENAR CARDS
  const reorderCards = async () => {
    if (!activeBoardId || !activeBoard) return;
  
    const originalCards = activeBoard.cards; // Guardar el estado original para posible reversión
  
    // 1. Crear un mapa para acceder fácilmente a las tarjetas por su columna
    const cardsByColumn = new Map();
    activeBoard.columns.forEach(col => cardsByColumn.set(col.id, []));
    activeBoard.cards.forEach(card => {
      // Asegurarse de que la tarjeta pertenece a una columna existente
      if (cardsByColumn.has(card.column)) {
        cardsByColumn.get(card.column).push(card);
      }
    });

    // 2. Preparar los datos para la API: un array plano de tarjetas con su nuevo orden y columna.
    // El orden se calcula basándose en la posición de la tarjeta dentro de su columna en el estado actual.
    const cardsToUpdate = [];
    cardsByColumn.forEach((cardArray, columnId) => {
      cardArray.forEach((card, index) => {
        cardsToUpdate.push({ 
          _id: card.id, // El ID de la tarjeta
          order: index, // El nuevo índice de orden dentro de la columna
          column: columnId // El ID de la columna a la que pertenece
        });
      });
    });
    
    // 3. Enviar la petición al backend (sin actualización optimista, ya que la UI ya está actualizada)
    try {
      const response = await fetch(`http://localhost:5001/api/boards/${activeBoardId}/reorder-cards`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cardsToUpdate }),
      });
      if (!response.ok) throw new Error('No se pudo guardar el nuevo orden de las tarjetas.');
      // Opcional: 
      toast.success('Orden de tarjetas guardado.');
    } catch (error) {
      toast.error(error.message);
      // Revertir el estado al original si la API falla
      updateActiveBoard(board => ({ ...board, cards: originalCards }));
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


  // AGREGAR COLUMNA
  const addColumn = async () => {
    if (!activeBoardId) return;

    // 1. Crear una columna temporal para la actualización optimista
    const tempId = `temp-col-${crypto.randomUUID()}`;
    const newColumnOptimistic = { id: tempId, title: '', color: '#8b949e', cards: [] }; // Título vacío aquí

    // 2. Actualización optimista: añadir la columna a la UI
    updateActiveBoard(board => ({ ...board, columns: [...board.columns, newColumnOptimistic] }));
    setEditingColumnId(tempId); // Entrar en modo edición

    try {
      // 3. Enviar la petición al backend para crear la columna con un título por defecto
      const response = await fetch(`http://localhost:5001/api/boards/${activeBoardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }), // Enviamos un título vacío
      });

      if (!response.ok) throw new Error('No se pudo crear la columna.');

      const createdColumn = await response.json();

      // 4. Reemplazar la columna temporal con la real del backend
      updateActiveBoard(board => ({
        ...board,
        columns: board.columns.map(col =>
          col.id === tempId ? { ...createdColumn, id: createdColumn._id } : col
        ),
      }));
      setEditingColumnId(createdColumn._id); // Actualizar el ID en edición al ID permanente
    } catch (error) {
      toast.error(error.message);
      // Revertir la actualización optimista si falla
      updateActiveBoard(board => ({ ...board, columns: board.columns.filter(col => col.id !== tempId) }));
    }
  };




    // AGREGAR CARDS
  const addCard = async (columnId) => {
    // 1. Crear una tarjeta temporal para la UI
    const tempId = `temp-card-${crypto.randomUUID()}`;
    const newCardOptimistic = { id: tempId, title: '', column: columnId };

    // 2. Actualización optimista: añadir la tarjeta a la UI y entrar en modo edición
    updateActiveBoard(board => ({ ...board, cards: [...board.cards, newCardOptimistic] }));
    setEditingCardId(tempId);

    // Devolvemos el ID temporal para que el componente Card pueda usarlo
    return tempId;
  };



  // ACTUALIZAR CARD TITULO
  const updateCardTitle = async (cardId, newTitle) => {
    const trimmedTitle = newTitle.trim();
    const originalCards = activeBoard.cards;
    const cardToUpdate = originalCards.find(c => c.id === cardId);

    // Si el título está vacío, simplemente eliminamos la tarjeta (lógica de cancelación)
    if (trimmedTitle === '') {
      deleteCard(cardId); // deleteCard se encargará de la API si es necesario
      return;
    }

    // Si la tarjeta es nueva (ID temporal), la creamos en el backend
    if (cardId.startsWith('temp-card-')) {
      try {
        const response = await fetch(`http://localhost:5001/api/columns/${cardToUpdate.column}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmedTitle }),
        });
        if (!response.ok) throw new Error('No se pudo crear la tarjeta.');
        const createdCard = await response.json();

        // Reemplazar la tarjeta temporal con la real del backend
        updateActiveBoard(board => ({
          ...board,
          cards: board.cards.map(c => c.id === cardId ? { ...createdCard, id: createdCard._id } : c)
        }));
      } catch (error) {
        toast.error(error.message);
        // Revertir: eliminar la tarjeta temporal si la creación falla
        updateActiveBoard(board => ({ ...board, cards: originalCards.filter(c => c.id !== cardId) }));
      }
    } else {
      // Si la tarjeta ya existe, actualizamos su título
      // Actualización optimista
      updateActiveBoard(board => ({
        ...board,
        cards: board.cards.map(c => c.id === cardId ? { ...c, title: trimmedTitle } : c)
      }));

      // Llamada a la API para persistir el cambio
      try {
        const response = await fetch(`http://localhost:5001/api/cards/${cardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmedTitle }),
        });

        if (!response.ok) throw new Error('No se pudo actualizar el título de la tarjeta.');
        // No es necesario hacer nada con la respuesta si la actualización optimista fue exitosa
      } catch (error) {
        toast.error(error.message);
        // Revertir el cambio si la API falla
        updateActiveBoard(board => ({ ...board, cards: originalCards }));
      }
    }
  };


  // ELIMINAR CARDS
  const deleteCard = async (cardId) => {
    // No intentar eliminar tarjetas temporales que no existen en el backend
    if (cardId.startsWith('temp-card-')) {
      updateActiveBoard(board => ({
        ...board,
        cards: board.cards.filter(c => c.id !== cardId)
      }));
      return;
    }

    const originalCards = activeBoard.cards;
    // Actualización optimista
    updateActiveBoard(board => ({
      ...board,
      cards: board.cards.filter(c => c.id !== cardId)
    }));

    try {
      const response = await fetch(`http://localhost:5001/api/cards/${cardId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('No se pudo eliminar la tarjeta.');
      // No es necesario un toast de éxito para no ser muy intrusivo
    } catch (error) {
      toast.error(error.message);
      // Revertir si la API falla
      updateActiveBoard(board => ({ ...board, cards: originalCards }));
    }
  };


  // ACTUALIZAR COLUMNA TITULO
  const updateColumnTitle = async (id, newTitle) => {
    let trimmedTitle = newTitle.trim();
    const originalColumns = activeBoard.columns;
    const columnToUpdate = originalColumns.find(c => c.id === id);
    if (!columnToUpdate) return;

    // Si el título está vacío, se le asigna un título por defecto.
    if (trimmedTitle === '') {
      trimmedTitle = 'Columna'; // Título por defecto
    }

    // Actualización optimista
    updateActiveBoard(board => ({
      ...board,
      columns: board.columns.map(c => c.id === id ? { ...c, title: trimmedTitle } : c)
    }));

    try {
      const response = await fetch(`http://localhost:5001/api/columns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });
      if (!response.ok) throw new Error('No se pudo guardar el nuevo título.');
    } catch (error) {
      toast.error(error.message);
      // Revertir si falla la API
      updateActiveBoard(board => ({ ...board, columns: originalColumns }));
    }
  };



  // ACTUALIZAR COLUMNA COLOR
  const updateColumnColor = async (id, newColor) => {
    const originalColumns = activeBoard.columns;

    // Actualización optimista
    updateActiveBoard(board => ({
      ...board,
      columns: board.columns.map(c => c.id === id ? { ...c, color: newColor } : c)
    }));

    try {
      const response = await fetch(`http://localhost:5001/api/columns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: newColor }),
      });
      if (!response.ok) throw new Error('No se pudo guardar el nuevo color.');
      toast.success('Color de columna guardado.');
    } catch (error) {
      toast.error(error.message);
      // Revertir si falla la API
      updateActiveBoard(board => ({ ...board, columns: originalColumns }));
    }
  };


  const handleDeleteColumnRequest = (columnId) => setColumnToDelete(columnId);

  // ELIMINAR COLUMNA DIRECTAMENTE (sin modal)
  const deleteColumn = async (columnIdToDelete) => {
    if (!columnIdToDelete) return;

    const originalBoard = activeBoard;

    // Actualización optimista con animación
    setExitingItemIds(prev => [...prev, columnIdToDelete]);

    setTimeout(() => {
      updateActiveBoard(board => ({
        ...board,
        columns: board.columns.filter(col => col.id !== columnIdToDelete),
        cards: board.cards.filter(card => card.column !== columnIdToDelete),
      }));
    }, 400); // Duración de la animación de salida

    try {
      const response = await fetch(`http://localhost:5001/api/columns/${columnIdToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('No se pudo eliminar la columna del servidor.');

      // No mostramos toast de éxito porque es una acción automática
    } catch (error) {
      toast.error(error.message);
      // Revertir si la API falla
      setBoards(prevBoards => prevBoards.map(b => b.id === activeBoardId ? originalBoard : b));
      setExitingItemIds(prev => prev.filter(id => id !== columnIdToDelete));
    }
  };



  // MODAL ELIMINAR COLUMNA
  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      const columnIdToDelete = columnToDelete;
      const originalBoard = activeBoard;

      // Actualización optimista con animación
      setExitingItemIds(prev => [...prev, columnIdToDelete]);
      setColumnToDelete(null);

      setTimeout(() => {
        updateActiveBoard(board => ({
          ...board,
          columns: board.columns.filter(col => col.id !== columnIdToDelete),
          cards: board.cards.filter(card => card.column !== columnIdToDelete),
        }));
      }, 400);

      try {
        const response = await fetch(`http://localhost:5001/api/columns/${columnIdToDelete}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('No se pudo eliminar la columna del servidor.');

        toast.success('Columna eliminada.');
      } catch (error) {
        toast.error(error.message);
        // Revertir si la API falla
        setBoards(prevBoards => prevBoards.map(b => b.id === activeBoardId ? originalBoard : b));
        setExitingItemIds(prev => prev.filter(id => id !== columnIdToDelete));
      }
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
    reorderColumns,
    reorderCards,
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
    deleteColumn, // Exportamos la nueva función
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