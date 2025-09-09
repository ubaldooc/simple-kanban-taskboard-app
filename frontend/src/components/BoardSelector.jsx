import React, { useState, useRef, useEffect } from 'react';

const BoardSelector = ({
  boards,
  activeBoard,
  onBoardSelect,
  onBoardAdd,
  onBoardEdit,
  onBoardDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);

  // Hook para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (boardId) => {
    onBoardSelect(boardId);
    setIsOpen(false);
  };

  const handleAdd = () => {
    onBoardAdd();
    setIsOpen(false);
  };

  const handleEdit = (e, boardId) => {
    e.stopPropagation(); // Evita que el dropdown se cierre
    onBoardEdit(boardId);
    setIsOpen(false);
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
            <li key={board.id} onClick={() => handleSelect(board.id)}>
              <span className="board-name">{board.title}</span>
              <div className="board-actions">
                <i className="fas fa-pencil-alt" title="Renombrar tablero" onClick={(e) => handleEdit(e, board.id)}></i>
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