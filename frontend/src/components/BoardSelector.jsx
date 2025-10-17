import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import SortableBoardItem from './SortableBoardItem.jsx';
import { useTaskboardContext } from '../context/TaskboardContext.jsx';

const BoardSelector = () => {
  const {
    boards,
    activeBoard,
    setActiveBoardId,
    addBoard,
    editBoard,
    requestDeleteBoard,
    reorderBoards,
    newBoardIdToEdit,
    setNewBoardIdToEdit,
  } = useTaskboardContext();

  const [isOpen, setIsOpen] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeDragItem, setActiveDragItem] = useState(null);
  const selectorRef = useRef(null);

  const saveEdit = useCallback(() => {
    if (editingBoardId && editingTitle.trim()) {
      editBoard(editingBoardId, editingTitle.trim());
    }
    setEditingBoardId(null);
  }, [editingBoardId, editingTitle, editBoard]);

  // Hook para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
        // Si se hace clic fuera mientras se edita, guarda los cambios
        if (editingBoardId) {
          saveEdit();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [saveEdit]);

  // Hook para entrar en modo edición al crear un nuevo tablero
  useEffect(() => {
    if (newBoardIdToEdit) {
      const newBoard = boards.find(b => b.id === newBoardIdToEdit);
      if (newBoard) {
        setIsOpen(true); // Asegura que el dropdown esté abierto
        setEditingBoardId(newBoard.id);
        setEditingTitle(newBoard.title); // Pre-rellena el input con el título
        setNewBoardIdToEdit(null); // Resetea el estado en el hook principal
      }
    }
  }, [newBoardIdToEdit, boards, setNewBoardIdToEdit]);

  const handleSelect = (boardId) => {
    if (editingBoardId) return; // No cambiar de tablero mientras se edita
    setActiveBoardId(boardId);
    setIsOpen(false);
  };

  const handleAdd = () => {
    addBoard();
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

  // --- DND Kit Logic ---  LOGICA PARA REORDENAR BOARDS
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }, // Requiere mover 5px para iniciar el arrastre
  }));

  const handleDragStart = (event) => {
    // Prevenir el inicio del arrastre si se está editando un tablero
    if (editingBoardId) {
      setActiveDragItem(null);
      return;
    }
    const { active } = event;
    setActiveDragItem(boards.find(b => b.id === active.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    // Si no se soltó sobre un elemento válido o se soltó en el mismo lugar, no hacer nada.
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = boards.findIndex(b => b.id === active.id);
    const newIndex = boards.findIndex(b => b.id === over.id);

    reorderBoards(oldIndex, newIndex);
  };


  
  // LOGICA PARA ELIMINAR BOARDS
  const handleDelete = (e, boardId) => {
    e.stopPropagation(); // Evita que el dropdown se cierre
    requestDeleteBoard(boardId);
    setIsOpen(false);
  };

  // Si no hay tableros, muestra un botón para crear el primero.
  if (boards.length === 0) {
    return (
      <div className="board-selector">
        <button className="create-first-board-btn" onClick={addBoard}>
          <i className="fas fa-plus"></i> Crear primer tablero
        </button>
      </div>
    );
  }

  return (
    <div className="board-selector" ref={selectorRef}>
      <div className="board-selector-active" onClick={() => setIsOpen(!isOpen)}>
        <span>{activeBoard?.title || 'Selecciona un tablero'}</span>
        <i className={`fas fa-chevron-down ${isOpen ? 'open' : ''}`}></i>
      </div>
      {isOpen && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <ul className="board-selector-dropdown">
            <SortableContext items={boards.map(b => b.id)}>
              {boards.map(board => (
                <SortableBoardItem
                  key={board.id}
                  board={board}
                  isEditing={editingBoardId === board.id}
                  editingTitle={editingTitle}
                  onTitleChange={handleTitleChange}
                  onTitleKeyDown={handleTitleKeyDown}
                  onSaveEdit={saveEdit} // Pasamos la función para el ícono de check
                  onSelect={handleSelect}
                  onStartEditing={startEditing}
                  onDelete={handleDelete}
                  canDelete={true}
                />
              ))}
            </SortableContext>
            <li className="add-board-option" onClick={handleAdd}>
              ✚ Crear nuevo tablero...
            </li>
          </ul>
          <DragOverlay>
            {activeDragItem ? (
              <SortableBoardItem
                board={activeDragItem}
                isDragging={true}
                canDelete={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default BoardSelector;