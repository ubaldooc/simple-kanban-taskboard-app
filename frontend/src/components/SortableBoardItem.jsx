import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableBoardItem = ({
  board,
  isEditing,
  editingTitle,
  onTitleChange,
  onTitleKeyDown,
  onSaveEdit,
  onSelect,
  onStartEditing,
  onDelete,
  canDelete,
  isDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: board.id,
    data: { type: 'BoardItem', board },
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleItemClick = () => {
    if (!isEditing) {
      onSelect(board.id);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={handleItemClick}
      className={`
        board-list-item 
        ${isEditing ? 'editing' : ''}
        ${isDragging ? 'is-dragging-board-item' : ''}
      `}
    >
      <div className="board-item-content">
        {/* Icono para arrastrar */}
        <i className="fas fa-grip-vertical drag-handle" {...attributes} {...listeners}></i>

        {isEditing ? (
          <>
            <input
              type="text"
              value={editingTitle}
              onChange={onTitleChange}
              onKeyDown={onTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="board-name-input"
            />
            <div className="board-edit-actions">
              <i className="fas fa-check" title="Guardar cambios" onClick={onSaveEdit}></i>
            </div>
          </>
        ) : (
          <span className="board-name">{board.title}</span>
        )}
      </div>

      {!isEditing && (
        <div className="board-actions">
          <i className="fas fa-pencil-alt" title="Renombrar tablero" onClick={(e) => onStartEditing(e, board)}></i>
          {canDelete && (
            <i className="fas fa-trash-alt" title="Eliminar tablero" onClick={(e) => onDelete(e, board.id)}></i>
          )}
        </div>
      )}
    </li>
  );
};

export default SortableBoardItem;