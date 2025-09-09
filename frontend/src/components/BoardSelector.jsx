import React, { useState, useRef, useEffect } from 'react';

const BoardSelector = ({
  boards,
  activeBoard,
  onBoardSelect,
  onBoardAdd,
  onBoardEdit,
  onBoardDelete,
  newBoardIdToEdit,
  onEditModeEntered,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const selectorRef = useRef(null);

  // Hook para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
        // Si se hace clic fuera mientras se edita, cancela la edición
        setEditingBoardId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hook para entrar en modo edición al crear un nuevo tablero
  useEffect(() => {
    if (newBoardIdToEdit) {
      const newBoard = boards.find(b => b.id === newBoardIdToEdit);
      if (newBoard) {
        setIsOpen(true); // Asegura que el dropdown esté abierto
        setEditingBoardId(newBoard.id);
        setEditingTitle(newBoard.title);
        onEditModeEntered(); // Notifica al padre que se ha entrado en modo edición
      }
    }
  }, [newBoardIdToEdit, boards, onEditModeEntered]);

  const handleSelect = (boardId) => {
    if (editingBoardId) return; // No cambiar de tablero mientras se edita
    onBoardSelect(boardId);
    setIsOpen(false);
  };

  const handleAdd = () => {
    onBoardAdd();
    // No cerramos el dropdown para que el usuario vea el nuevo tablero
  };

  const startEditing = (e, board) => {
    e.stopPropagation(); // Evita que el dropdown se cierre
    setEditingBoardId(board.id);
    setEditingTitle(board.title);
  };

  const handleTitleChange = (e) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingBoardId(null);
    }
  };

  const saveEdit = () => {
    if (editingTitle.trim()) {
      onBoardEdit(editingBoardId, editingTitle.trim());
    }
    setEditingBoardId(null);
  };

  const handleDelete = (e, boardId) => {
    e.stopPropagation(); // Evita que el dropdown se cierre
    onBoardDelete(boardId);
    setIsOpen(false);
  };

  return (
    <div className="board-selector" ref={selectorRef}>
      <div className="board-selector-active" onClick={() => setIsOpen(!isOpen)}>
        <span>{activeBoard?.title || 'Selecciona un tablero'}</span>
        <i className={`fas fa-chevron-down ${isOpen ? 'open' : ''}`}></i>
      </div>
      {isOpen && (
        <ul className="board-selector-dropdown">
          {boards.map(board => (
            <li key={board.id} onClick={() => handleSelect(board.id)} className={editingBoardId === board.id ? 'editing' : ''}>
              {editingBoardId === board.id ? (
                <>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={handleTitleChange}
                    onKeyDown={handleTitleKeyDown}
                    onClick={(e) => e.stopPropagation()} // Evita que el li se active
                    autoFocus
                    className="board-name-input"
                  />
                  <div className="board-edit-actions">
                    <i className="fas fa-check" title="Guardar cambios" onClick={saveEdit}></i>
                  </div>
                </>
              ) : (
                <span className="board-name">{board.title}</span>
              )}
              <div className="board-actions">
                {editingBoardId !== board.id && (
                  <i className="fas fa-pencil-alt" title="Renombrar tablero" onClick={(e) => startEditing(e, board)}></i>
                )}
                {boards.length > 1 && ( // No permitir eliminar el último tablero
                  <i className="fas fa-trash-alt" title="Eliminar tablero" onClick={(e) => handleDelete(e, board.id)}></i>
                )}
              </div>
            </li>
          ))}
          <li className="add-board-option" onClick={handleAdd}>
            ✚ Crear nuevo tablero...
          </li>
        </ul>
      )}
    </div>
  );
};

export default BoardSelector;