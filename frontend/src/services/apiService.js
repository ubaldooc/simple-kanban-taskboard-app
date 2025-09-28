import * as guestApi from '../hooks/localStorageService.js';

const API_BASE_URL = 'http://localhost:5001/api';

// --- Implementación de la API "Online" (usando fetch) ---
const onlineApi = {
  
  getUserPreferences: () => fetch(`${API_BASE_URL}/user/preferences`).then(res => res.json()),
  
  updateUserPreferences: (prefs) => fetch(`${API_BASE_URL}/user/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  }).then(res => res.json()),

  getBoardsList: () => fetch(`${API_BASE_URL}/boards/list`).then(res => res.json()),
  
  getBoardDetails: (boardId) => fetch(`${API_BASE_URL}/boards/${boardId}`).then(res => res.json()),
  
  createBoard: (boardData) => fetch(`${API_BASE_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boardData),
  }).then(res => res.json()),
  
  updateBoard: (boardId, updateData) => fetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  }).then(res => res.json()),
  
  deleteBoard: (boardId) => fetch(`${API_BASE_URL}/boards/${boardId}`, { method: 'DELETE' }).then(res => res.json()),
  
  reorderBoards: (boardIds) => fetch(`${API_BASE_URL}/boards/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardIds }),
  }).then(res => res.json()),

  createColumn: (boardId, columnData) => fetch(`${API_BASE_URL}/boards/${boardId}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(columnData),
  }).then(res => res.json()),
  
  updateColumn: (columnId, updateData) => fetch(`${API_BASE_URL}/columns/${columnId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  }).then(res => res.json()),
  
  deleteColumn: (columnId) => fetch(`${API_BASE_URL}/columns/${columnId}`, { method: 'DELETE' }).then(res => res.json()),
  
  reorderColumns: (boardId, columnIds) => fetch(`${API_BASE_URL}/boards/${boardId}/reorder-columns`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnIds }),
  }).then(res => res.json()),

  createCard: (columnId, cardData) => fetch(`${API_BASE_URL}/columns/${columnId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData),
  }).then(res => res.json()),
  updateCard: (cardId, updateData) => fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  }).then(res => res.json()),
  
  deleteCard: (cardId) => fetch(`${API_BASE_URL}/cards/${cardId}`, { method: 'DELETE' }).then(res => res.json()),
  
  reorderCards: (boardId, cards) => fetch(`${API_BASE_URL}/boards/${boardId}/reorder-cards`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  }).then(res => res.json()),

  // Función para crear un tablero por defecto si la BD está vacía
  createDefaultBoard: () => fetch(`${API_BASE_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Mi Primer Tablero',
      columns: [
        { title: 'Tareas por hacer', color: '#42A5F5', cards: [{ title: '¡Bienvenido a tu nuevo tablero!' }] },
        { title: 'En proceso', color: '#FFA726' },
        { title: 'Completado', color: '#66BB6A' },
      ],
    }),
  }).then(res => res.json()),
};

/**
 * Devuelve el objeto de la API correspondiente según el modo de autenticación.
 * @param {string} authMode - Puede ser 'guest' o 'online'.
 * @returns {object} El objeto de la API a utilizar.
 */
export const getApiService = (authMode) => {
  if (authMode === 'guest') {
    // El localStorageService puede tener una exportación por defecto (`export default apiObject`)
    // o exportaciones nombradas (`export const func1...`).
    // `guestApi.default` cubre el primer caso, y el `|| guestApi` cubre el segundo.
    // Esto hace que el código sea más robusto sin importar cómo esté estructurado localStorageService.js.
    return guestApi.default || guestApi;
  }
  // Para el modo online, devolvemos las funciones que usan fetch
  return onlineApi;
};