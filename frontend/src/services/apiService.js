import guestApi from '../hooks/localStorageService.js';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }
  // Si la respuesta es 204 No Content, no hay cuerpo para parsear.
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

const API_BASE_URL = 'http://localhost:5001/api';

// --- Implementación de la API "Online" (usando fetch) ---
const onlineApi = {
  
  getUserPreferences: () => fetch(`${API_BASE_URL}/user/preferences`, { credentials: 'include' }).then(handleResponse),
  
  updateUserPreferences: (prefs) => fetch(`${API_BASE_URL}/user/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
    credentials: 'include',
  }).then(handleResponse),

  getBoardsList: () => fetch(`${API_BASE_URL}/boards/list`, { credentials: 'include' }).then(handleResponse),
  
  getBoardDetails: (boardId) => fetch(`${API_BASE_URL}/boards/${boardId}`, { credentials: 'include' }).then(handleResponse),
  
  createBoard: (boardData) => fetch(`${API_BASE_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boardData),
    credentials: 'include',
  }).then(handleResponse),
  
  updateBoard: (boardId, updateData) => fetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
    credentials: 'include',
  }).then(handleResponse),
  
  deleteBoard: (boardId) => fetch(`${API_BASE_URL}/boards/${boardId}`, { method: 'DELETE', credentials: 'include' }).then(handleResponse),
  
  reorderBoards: (boardIds) => fetch(`${API_BASE_URL}/boards/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardIds }),
    credentials: 'include',
  }).then(handleResponse),

  createColumn: (boardId, columnData) => fetch(`${API_BASE_URL}/boards/${boardId}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(columnData),
    credentials: 'include',
  }).then(handleResponse),
  
  updateColumn: (columnId, updateData) => fetch(`${API_BASE_URL}/columns/${columnId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
    credentials: 'include',
  }).then(handleResponse),
  
  deleteColumn: (columnId) => fetch(`${API_BASE_URL}/columns/${columnId}`, { method: 'DELETE', credentials: 'include' }).then(handleResponse),
  
  reorderColumns: (boardId, columnIds) => fetch(`${API_BASE_URL}/boards/${boardId}/reorder-columns`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnIds }),
    credentials: 'include',
  }).then(handleResponse),

  createCard: (columnId, cardData) => fetch(`${API_BASE_URL}/columns/${columnId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData),
    credentials: 'include',
  }).then(handleResponse),
  updateCard: (cardId, updateData) => fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
    credentials: 'include',
  }).then(handleResponse),
  
  deleteCard: (cardId) => fetch(`${API_BASE_URL}/cards/${cardId}`, { method: 'DELETE', credentials: 'include' }).then(handleResponse),
  
  reorderCards: (boardId, cards) => fetch(`${API_BASE_URL}/boards/${boardId}/reorder-cards`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
    credentials: 'include',
  }).then(handleResponse),

};

/**
 * Devuelve el objeto de la API correspondiente según el modo de autenticación.
 * @param {string} authMode - Puede ser 'guest' o 'online'.
 * @returns {object} El objeto de la API a utilizar.
 */
export const getApiService = (authMode) => {
  if (authMode === 'guest') {
    return guestApi;
  }
  // Para el modo online, devolvemos las funciones que usan fetch
  return onlineApi;
};