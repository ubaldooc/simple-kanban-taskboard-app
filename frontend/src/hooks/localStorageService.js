/**
 * localStorageService.js
 * 
 * Este servicio simula una API de backend utilizando el localStorage del navegador.
 * Proporciona un conjunto de funciones que leen y escriben datos, imitando
 * la interfaz de la API online para que la aplicación pueda funcionar en modo "invitado" (offline).
 * 
 * La estructura de datos en localStorage es un único objeto JSON bajo la clave 'taskboardData'.
 * {
 *   boards: [],
 *   columns: [],
 *   cards: [],
 *   preferences: {}
 * }
 */

const DB_KEY = 'taskboardData';

// --- Funciones auxiliares para interactuar con localStorage ---

/**
 * Obtiene todos los datos de la "base de datos" de localStorage.
 * Si no existen datos, devuelve una estructura vacía.
 */
const _getData = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error al leer desde localStorage:", error);
  }
  // Devuelve una estructura por defecto si no hay nada o hay un error
  return { boards: [], columns: [], cards: [], preferences: {} };
};

/**
 * Guarda el objeto de datos completo en localStorage.
 * @param {object} data El objeto completo de datos (boards, columns, cards, prefs).
 */
const _saveData = (data) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
  }
};

// --- Implementación de la API de localStorage ---

const api = {
  // --- Preferencias de Usuario ---
  getUserPreferences: async () => {
    const db = _getData();
    return db.preferences || { lastActiveBoardId: null };
  },

  updateUserPreferences: async (prefs) => {
    const db = _getData();
    db.preferences = { ...db.preferences, ...prefs };
    _saveData(db);
    return db.preferences;
  },

  // --- Tableros (Boards) ---
  getBoardsList: async () => {
    const db = _getData();
    // Devuelve solo la lista de tableros, ordenados por su campo 'order'
    return [...db.boards].sort((a, b) => a.order - b.order);
  },

  getBoardDetails: async (boardId) => {
    const db = _getData();
    const board = db.boards.find(b => b.id === boardId);
    if (!board) return null;

    const columns = db.columns
      .filter(c => c.boardId === boardId)
      .sort((a, b) => a.order - b.order);

    const columnIds = columns.map(c => c.id);
    const cards = db.cards
      .filter(c => columnIds.includes(c.column))
      .sort((a, b) => a.order - b.order);

    // Simula la respuesta del backend con _id
    return {
      ...board,
      _id: board.id,
      columns: columns.map(c => ({ ...c, _id: c.id })),
      cards: cards.map(c => ({ ...c, _id: c.id })),
    };
  },

  createBoard: async (boardData) => {
    const db = _getData();
    const newId = `board-${crypto.randomUUID()}`;
    const newBoard = {
      id: newId,
      _id: newId, // Simula _id, asegurando que sea el mismo que el id
      title: boardData.title,
      order: db.boards.length, // Se añade al final
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.boards.push(newBoard);

    // Si se envían columnas para crear, las creamos también
    const createdColumns = (boardData.columns || []).map((col, index) => {
      const newColId = `col-${crypto.randomUUID()}`;
      const newCol = {
        id: newColId,
        _id: newColId,
        boardId: newBoard.id,
        title: col.title,
        color: col.color,
        order: index,
      };
      db.columns.push(newCol);
      return newCol;
    });

    _saveData(db);
    return { ...newBoard, columns: createdColumns, cards: [] };
  },

  updateBoard: async (boardId, updateData) => {
    const db = _getData();
    const boardIndex = db.boards.findIndex(b => b.id === boardId);
    if (boardIndex !== -1) {
      db.boards[boardIndex] = { 
        ...db.boards[boardIndex], 
        ...updateData,
        updatedAt: new Date().toISOString(), // Actualiza el timestamp
      };
      _saveData(db);
      return db.boards[boardIndex];
    }
    return null;
  },

  deleteBoard: async (boardId) => {
    const db = _getData();
    const columnsToDelete = db.columns.filter(c => c.boardId === boardId);
    const columnIdsToDelete = columnsToDelete.map(c => c.id);

    db.boards = db.boards.filter(b => b.id !== boardId);
    db.columns = db.columns.filter(c => c.boardId !== boardId);
    db.cards = db.cards.filter(c => !columnIdsToDelete.includes(c.column));

    _saveData(db);
    return { message: 'Tablero eliminado' };
  },

  reorderBoards: async (boardIds) => {
    const db = _getData();
    db.boards.forEach(board => {
      const newOrder = boardIds.indexOf(board.id);
      board.order = newOrder !== -1 ? newOrder : board.order;
    });
    _saveData(db);
    return { message: 'Orden de tableros actualizado' };
  },

  // --- Columnas (Columns) ---
  createColumn: async (boardId, columnData) => {
    const db = _getData();
    const newColumn = {
      id: `col-${crypto.randomUUID()}`,
      boardId: boardId,
      title: columnData.title,
      color: columnData.color || '#8b949e',
      order: db.columns.filter(c => c.boardId === boardId).length,
    };
    newColumn._id = newColumn.id; // Simula _id
    db.columns.push(newColumn);
    _saveData(db);
    return newColumn;
  },

  updateColumn: async (columnId, updateData) => {
    const db = _getData();
    const colIndex = db.columns.findIndex(c => c.id === columnId);
    if (colIndex !== -1) {
      db.columns[colIndex] = { ...db.columns[colIndex], ...updateData };
      _saveData(db);
      return db.columns[colIndex];
    }
    return null;
  },

  deleteColumn: async (columnId) => {
    const db = _getData();
    db.columns = db.columns.filter(c => c.id !== columnId);
    db.cards = db.cards.filter(c => c.column !== columnId);
    _saveData(db);
    return { message: 'Columna eliminada' };
  },

  reorderColumns: async (boardId, columnIds) => {
    const db = _getData();
    db.columns.filter(c => c.boardId === boardId).forEach(col => {
      const newOrder = columnIds.indexOf(col.id);
      col.order = newOrder !== -1 ? newOrder : col.order;
    });
    _saveData(db);
    return { message: 'Orden de columnas actualizado' };
  },

  // --- Tarjetas (Cards) ---
  createCard: async (columnId, cardData) => {
    const db = _getData();
    const newCard = {
      id: `card-${crypto.randomUUID()}`,
      column: columnId,
      title: cardData.title,
      order: db.cards.filter(c => c.column === columnId).length,
    };
    newCard._id = newCard.id; // Simula _id
    db.cards.push(newCard);
    _saveData(db);
    return newCard;
  },

  updateCard: async (cardId, updateData) => {
    const db = _getData();
    const cardIndex = db.cards.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      db.cards[cardIndex] = { ...db.cards[cardIndex], ...updateData };
      _saveData(db);
      return db.cards[cardIndex];
    }
    return null;
  },

  deleteCard: async (cardId) => {
    const db = _getData();
    db.cards = db.cards.filter(c => c.id !== cardId);
    _saveData(db);
    return { message: 'Tarjeta eliminada' };
  },

  reorderCards: async (boardId, cardsToUpdate) => {
    const db = _getData();
    cardsToUpdate.forEach(update => {
      const cardIndex = db.cards.findIndex(c => c.id === update._id);
      if (cardIndex !== -1) {
        db.cards[cardIndex].order = update.order;
        db.cards[cardIndex].column = update.column;
      }
    });
    _saveData(db);
    return { message: 'Orden de tarjetas actualizado' };
  },

  // --- Funciones especiales ---
  createDefaultBoard: async () => {
    const boardData = {
      title: 'Mi Primer Tablero',
      columns: [
        { title: 'Tareas por hacer', color: '#42A5F5' },
        { title: 'En proceso', color: '#FFA726' },
        { title: 'Completado', color: '#66BB6A' },
      ],
    };
    const createdBoard = await api.createBoard(boardData);
    
    // Añadir una tarjeta de bienvenida
    const firstColumnId = createdBoard.columns[0]?.id;
    if (firstColumnId) {
      await api.createCard(firstColumnId, { title: '¡Bienvenido a tu nuevo tablero!' });
    }

    // Recargamos los detalles para devolver todo completo
    return api.getBoardDetails(createdBoard.id);
  },
};

export default api;