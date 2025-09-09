import React, { useState, useRef, useEffect } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import SortableBoardItem from './SortableBoardItem';

const BoardSelector = ({
  boards,
  activeBoard,
  onBoardSelect,
  onBoardAdd,
  onBoardEdit,
  onBoardDelete,
  onReorderBoards,
  newBoardIdToEdit,
  onEditModeEntered,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeDragItem, setActiveDragItem] = useState(null);
  const selectorRef = useRef(null);

  // Hook para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
        // Si se hace clic fuera mientras se edita, guarda los cambios
        if (editingBoardId) {
          saveEdit();
        }
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

  // --- DND Kit Logic ---
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }, // Requiere mover 5px para iniciar el arrastre
  }));

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveDragItem(boards.find(b => b.id === active.id));
  };

  const handleDragEnd = (event) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex(b => b.id === active.id);
      const newIndex = boards.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderBoards(oldIndex, newIndex);
      }
    }
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
                  onSaveEdit={saveEdit}
                  onSelect={handleSelect}
                  onStartEditing={startEditing}
                  onDelete={handleDelete}
                  canDelete={boards.length > 1}
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
                canDelete={boards.length > 1}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default BoardSelector;