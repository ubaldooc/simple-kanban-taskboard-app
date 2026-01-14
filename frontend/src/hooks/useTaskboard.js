import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { arrayMove } from '@dnd-kit/sortable';

import { useAuth } from '../context/AuthContext';
import { getApiService } from '../services/apiService';



// --- Helper Functions ---

export const useTaskboard = () => {
  const { authMode, isAuthLoading } = useAuth();  // Obtenemos también el estado de carga de la autenticación
  const api = useMemo(() => getApiService(authMode), [authMode]); //Esta línea declara una constante api y le asigna un valor de online u offline dependiendo del valor de authMode. Este valor se usara para hacer las llamadas a la API. Si authMode cambia, se recalcula el valor de api.

  // console.log(authMode);
  // console.log(api);


  // --- State Management ---  DEFINIMOS LOS ESTADOS PRINCIPALES
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardIdState] = useState(null);
  const [slideDirection, setSlideDirection] = useState(0); // 1 para derecha (next), -1 para izquierda (prev)

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
      // Usamos el servicio de API
      const detailedBoard = await api.getBoardDetails(boardId);
      // console.log(detailedBoard);

      if (!detailedBoard) throw new Error('No se pudieron cargar los detalles del tablero.');

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
      // ¡CAMBIO CLAVE! Si la autenticación aún se está verificando, no hacemos nada.
      // El efecto se volverá a ejecutar cuando isAuthLoading cambie a `false`.
      if (isAuthLoading) {
        return;
      }

      setIsLoading(true);
      try {
        // Hacemos las dos peticiones en paralelo para más eficiencia
        const [boardsData, prefsData] = await Promise.all([
          api.getBoardsList(),
          api.getUserPreferences()
        ]);

        // Transforma los datos del backend (_id) al formato del frontend (id)
        const finalBoardsData = boardsData.map(board => ({
          ...board,
          id: board._id, // El _id viene por defecto
          // Inicializamos columns y cards como arrays vacíos. Se cargarán bajo demanda.
          columns: [],
          cards: [],
        }));

        setBoards(finalBoardsData);

        const lastActiveId = prefsData.lastActiveBoardId;
        const idToLoad = lastActiveId && finalBoardsData.some(b => b.id === lastActiveId) ? lastActiveId : finalBoardsData[0]?.id;

        // Establece el tablero activo y carga sus detalles
        if (idToLoad) {
          // Llamamos a setActiveBoardId para guardar la preferencia.
          setActiveBoardId(idToLoad);
          // ¡CLAVE! Esperamos a que los detalles del tablero se carguen antes de terminar el loading.
          await fetchBoardDetails(idToLoad);
        }
      } catch (error) {
        console.error("Error al cargar los tableros:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, [api, isAuthLoading]); // Se re-ejecuta si la API cambia o cuando la autenticación termina

  useEffect(() => {
    // Cargar detalles cuando el tablero activo cambia y no tiene columnas cargadas
    // Esta lógica se ha movido al useEffect principal para mayor robustez.
    // Mantenemos este efecto para otros casos, pero la carga inicial ya no depende de él.
    if (activeBoard && activeBoard.columns.length === 0 && !activeBoard.id.startsWith('temp-')) {
      fetchBoardDetails(activeBoard.id);
    }
  }, [activeBoard]); // Dependemos de `activeBoard` directamente, es más seguro que `activeBoardId`.

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

  const setActiveBoardId = (id, direction = 0) => {
    if (id === activeBoardId) return;
    setSlideDirection(direction);
    setActiveBoardIdState(id);
    // Guarda la preferencia en el backend en lugar de localStorage
    api.updateUserPreferences({ lastActiveBoardId: id }).catch(error => {
      console.error('No se pudo guardar la preferencia del tablero activo:', error);
    });
  };

  const nextBoard = () => {
    if (boards.length < 2) return;
    const currentIndex = boards.findIndex((b) => b.id === activeBoardId);
    const nextIndex = (currentIndex + 1) % boards.length;
    setActiveBoardId(boards[nextIndex].id, 1);
  };

  const prevBoard = () => {
    if (boards.length < 2) return;
    const currentIndex = boards.findIndex((b) => b.id === activeBoardId);
    const prevIndex = (currentIndex - 1 + boards.length) % boards.length;
    setActiveBoardId(boards[prevIndex].id, -1);
  };

  // --- Helper to update the active board ---
  const updateActiveBoard = (updater) => {
    setBoards(prevBoards => prevBoards.map(board => board.id === activeBoardId ? updater(board) : board));
  };






  // --- Board Management ---


  // AGREGAR BOARDS
  const addBoard = async () => {
    try {
      // 1. Enviar los datos al backend para crear el tablero y sus columnas por defecto.
      const newBoardDataForBackend = {
        title: 'Nuevo Tablero', // Título por defecto en el backend
        columns: [{ title: 'To Do', color: '#42A5F5' }],
      };

      const createdBoard = await api.createBoard(newBoardDataForBackend);
      if (!createdBoard) throw new Error('Error al crear el tablero');

      // 2. Transformar la respuesta del backend al formato del estado del frontend.
      const newBoardForState = {
        ...createdBoard,
        id: createdBoard._id,
        columns: (createdBoard.columns || []).map(col => ({ ...col, id: col._id })),
        cards: createdBoard.cards || [],
      };

      // 3. Añadir el nuevo tablero al estado.
      setBoards(prevBoards => [...prevBoards, newBoardForState]);

      // 4. Establecer el nuevo tablero como activo e iniciar la edición de su título.
      setActiveBoardId(createdBoard._id);
      setNewBoardIdToEdit(createdBoard._id);

    } catch (error) {
      console.error("Error en addBoard:", error);
      toast.error('No se pudo crear el tablero.');
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
        const result = await api.updateBoard(boardId, { title: trimmedTitle });
        if (!result) throw new Error('Error al actualizar el tablero en el servidor');
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
      const result = await api.reorderBoards(boardIds);
      if (!result) throw new Error('Error al guardar el orden de los tableros en el servidor.');

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
      const result = await api.reorderColumns(activeBoardId, columnIds);
      if (!result) throw new Error('No se pudo guardar el orden de las columnas.');
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
      const result = await api.reorderCards(activeBoardId, cardsToUpdate);
      if (!result) throw new Error('No se pudo guardar el nuevo orden de las tarjetas.');
      // toast.success('Orden de tarjetas guardado.');
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
        const result = await api.deleteBoard(boardIdToDelete);
        // En modo guest, el resultado puede no tener un `ok`. Asumimos que si no hay error, todo fue bien.
        // Para el modo online, la promesa rechazaría en un error de red, pero no para un 4xx/5xx.
        // La abstracción de la API debería manejar esto, pero por ahora esto funciona.
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
      const createdColumn = await api.createColumn(activeBoardId, { title: '' });
      if (!createdColumn) throw new Error('No se pudo crear la columna.');

      // 4. Reemplazar la columna temporal con la real del backend
      updateActiveBoard(board => {
        // Verificar si la columna temporal aún existe (pudo haber sido eliminada por el usuario mientras se creaba)
        const exists = board.columns.some(col => col.id === tempId);

        if (!exists) {
          // Si la columna ya no existe en el estado local, significa que fue eliminada.
          // Debemos eliminar la columna recién creada en el servidor para evitar datos huérfanos.
          api.deleteColumn(createdColumn._id).catch(err => console.error("Error limpiando columna huérfana:", err));
          return board; // No modificamos el estado
        }

        return {
          ...board,
          columns: board.columns.map(col =>
            col.id === tempId ? { ...createdColumn, id: createdColumn._id } : col
          ),
        };
      });
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
        const createdCard = await api.createCard(cardToUpdate.column, { title: trimmedTitle });
        if (!createdCard) throw new Error('No se pudo crear la tarjeta.');
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
        const result = await api.updateCard(cardId, { title: trimmedTitle });
        if (!result) throw new Error('No se pudo actualizar el título de la tarjeta.');
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
      const result = await api.deleteCard(cardId);
      if (!result) throw new Error('No se pudo eliminar la tarjeta.');
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
      const result = await api.updateColumn(id, { title: trimmedTitle });
      if (!result) throw new Error('No se pudo guardar el nuevo título.');
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
      const result = await api.updateColumn(id, { color: newColor });
      if (!result) throw new Error('No se pudo guardar el nuevo color.');
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

    // Si es una columna temporal, no hacemos la llamada al backend y eliminamos inmediatamente para evitar condiciones de carrera
    if (String(columnIdToDelete).startsWith('temp-')) {
      updateActiveBoard(board => ({
        ...board,
        columns: board.columns.filter(col => col.id !== columnIdToDelete),
        cards: board.cards.filter(card => card.column !== columnIdToDelete),
      }));
      return;
    }

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
      const result = await api.deleteColumn(columnIdToDelete);
      if (!result) throw new Error('No se pudo eliminar la columna del servidor.');
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

      // Si es una columna temporal, no hacemos la llamada al backend y eliminamos inmediatamente
      if (String(columnIdToDelete).startsWith('temp-')) {
        updateActiveBoard(board => ({
          ...board,
          columns: board.columns.filter(col => col.id !== columnIdToDelete),
          cards: board.cards.filter(card => card.column !== columnIdToDelete),
        }));
        setColumnToDelete(null);
        return;
      }

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
        const result = await api.deleteColumn(columnIdToDelete);
        if (!result) throw new Error('No se pudo eliminar la columna del servidor.');
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
    updateActiveBoard,
    slideDirection,
    nextBoard,
    prevBoard
  };
};