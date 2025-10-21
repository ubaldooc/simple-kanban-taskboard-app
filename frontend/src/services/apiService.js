import guestApi from '../hooks/localStorageService.js';
import apiClient from '../api/axios.js'; // Importamos nuestra instancia de Axios

const handleResponse = async (response) => {
  // Con Axios, la data ya viene en response.data. El manejo de errores se hace con interceptores o catch.
  return response.data;
};

// --- Implementación de la API "Online" (usando fetch) ---
const onlineApi = {
  
  getUserPreferences: () => apiClient.get('/user/preferences').then(handleResponse),
  
  updateUserPreferences: (prefs) => apiClient.put('/user/preferences', prefs).then(handleResponse),

  getBoardsList: () => apiClient.get('/boards/list').then(handleResponse),
  
  getBoardDetails: (boardId) => apiClient.get(`/boards/${boardId}`).then(handleResponse),
  
  createBoard: (boardData) => apiClient.post('/boards', boardData).then(handleResponse),
  
  updateBoard: (boardId, updateData) => apiClient.put(`/boards/${boardId}`, updateData).then(handleResponse),
  
  deleteBoard: (boardId) => apiClient.delete(`/boards/${boardId}`).then(handleResponse),
  
  reorderBoards: (boardIds) => apiClient.put('/boards/reorder', { boardIds }).then(handleResponse),

  createColumn: (boardId, columnData) => apiClient.post(`/boards/${boardId}/columns`, columnData).then(handleResponse),
  
  updateColumn: (columnId, updateData) => apiClient.put(`/columns/${columnId}`, updateData).then(handleResponse),
  
  deleteColumn: (columnId) => apiClient.delete(`/columns/${columnId}`).then(handleResponse),
  
  reorderColumns: (boardId, columnIds) => apiClient.put(`/boards/${boardId}/reorder-columns`, { columnIds }).then(handleResponse),

  createCard: (columnId, cardData) => apiClient.post(`/columns/${columnId}/cards`, cardData).then(handleResponse),
  
  updateCard: (cardId, updateData) => apiClient.put(`/cards/${cardId}`, updateData).then(handleResponse),
  
  deleteCard: (cardId) => apiClient.delete(`/cards/${cardId}`).then(handleResponse),
  
  reorderCards: (boardId, cards) => apiClient.put(`/boards/${boardId}/reorder-cards`, { cards }).then(handleResponse),

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