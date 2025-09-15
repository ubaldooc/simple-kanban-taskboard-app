import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import '../App.css';
import Column from './Column.jsx';
import Card from './Card.jsx';
import DeleteZone from './DeleteZone.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import useHotkeys from '../hooks/useHotkeys.js';
import ColumnOptionsDropdown from './ColumnOptionsDropdown.jsx';
import BoardSelector from './BoardSelector.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import logoImage from '../assets/logo.png';
import { useTaskboardContext } from '../context/TaskboardContext';
import { useTaskboardDnd } from '../hooks/useTaskboardDnd';

const ANIMATION_DURATION = 400;

export const TaskboardView = () => {
  const {
    boards,
    activeBoard,
    columns,
    cards,
    activeBoardId,
    setActiveBoardId,
    addBoard,
    editBoard,
    reorderBoards,
    requestDeleteBoard,
    confirmDeleteBoard,
    boardToDelete,
    setBoardToDelete,
    addColumn,
    addCard,
    updateColumnTitle,
    updateColumnColor,
    handleDeleteColumnRequest,
    confirmDeleteColumn,
    columnToDelete,
    setColumnToDelete,
    setEditingCardId,
    editingColumnId,
    setEditingColumnId,
    newBoardIdToEdit,
    setNewBoardIdToEdit,
    exitingItemIds,
    setExitingItemIds,
    updateActiveBoard
  } = useTaskboardContext();

  const [active, setActive] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState({ columnId: null, position: null });

  // --- DND Kit Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  // --- Column Options Dropdown Handler ---
  const handleToggleColumnOptions = (columnId, position) => {
    if (activeDropdown.columnId === columnId) {
      setActiveDropdown({ columnId: null, position: null }); // Cierra si ya está abierto
    } else {
      setActiveDropdown({ columnId, position }); // Abre en la nueva posición
    }
  };

  // --- Keyboard Shortcuts ---
  const hotkeys = useMemo(() => ({
    'ctrl+n': addColumn,
    'alt+arrowright': () => {
      const currentIndex = boards.findIndex(b => b.id === activeBoardId);
      const nextIndex = (currentIndex + 1) % boards.length;
      setActiveBoardId(boards[nextIndex].id);
    },
    'alt+arrowleft': () => {
      const currentIndex = boards.findIndex(b => b.id === activeBoardId);
      const prevIndex = (currentIndex - 1 + boards.length) % boards.length;
      setActiveBoardId(boards[prevIndex].id);
    },
  }), [boards, activeBoardId, addColumn, setActiveBoardId]);

  useHotkeys(hotkeys, [boards, activeBoardId]);

  const handleCardCreationKeyDown = (e, columnId) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Enter sin Shift
      addCard(columnId);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === "Card" || active.data.current?.type === "Column") {
      setIsDragging(true);
      setActive(active);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    setIsOverDeleteZone(over?.id === 'delete-zone');
    if (!over || active.id === over.id) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverACard = over.data.current?.type === 'Card';

    if (isActiveACard) {
      updateActiveBoard(board => {
        const activeIndex = board.cards.findIndex(c => c.id === active.id);
        let overIndex;

        if (isOverAColumn) {
          board.cards[activeIndex].column = over.id;
          return { ...board, cards: arrayMove(board.cards, activeIndex, activeIndex) };
        }
        
        if (isOverACard) {
          overIndex = board.cards.findIndex(c => c.id === over.id);
          if (board.cards[activeIndex].column !== board.cards[overIndex].column) {
            board.cards[activeIndex].column = board.cards[overIndex].column;
          }
          return { ...board, cards: arrayMove(board.cards, activeIndex, overIndex) };
        }
        return board;
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActive(null);
    setIsDragging(false);
    setIsOverDeleteZone(false);

    if (!over) return;

    if (over.id === 'delete-zone' && active.data.current?.type === 'Card') {
      setExitingItemIds(prev => [...prev, active.id]);
      setTimeout(() => {
        updateActiveBoard(board => ({
          ...board,
          cards: board.cards.filter(card => card.id !== active.id)
        }));
      }, ANIMATION_DURATION);
      return;
    }

    if (active.id !== over.id && active.data.current?.type === 'Column') {
      updateActiveBoard(board => {
        const oldIndex = board.columns.findIndex(c => c.id === active.id);
        const newIndex = board.columns.findIndex(c => c.id === over.id);
        return { ...board, columns: arrayMove(board.columns, oldIndex, newIndex) };
      });
    }
  };

  // --- Render Logic ---
  const activeCard = active && active.data.current?.type === 'Card' && cards.find(c => c.id === active.id);
  const activeColumn = active && active.data.current?.type === 'Column' && columns.find(c => c.id === active.id);

  if (!activeBoard) {
    return (
      <div className="task-board-container">
        <header className="task-board-header">
          <h1>No hay tableros</h1>
          <button onClick={addBoard}>Crear un tablero</button>
        </header>
      </div>
    );
  }

  return (
    <div className={`task-board-container ${isDragging ? 'is-dragging' : ''}`}>
      <header className="task-board-header">
        <div className="header-left">
          <img src={logoImage} alt="Taskboard Logo" className="header-logo" />
          <BoardSelector
            boards={boards}
            activeBoard={activeBoard}
            onBoardSelect={setActiveBoardId}
            onBoardAdd={addBoard}
            onBoardEdit={editBoard}
            onBoardDelete={requestDeleteBoard}
            onReorderBoards={reorderBoards}
            newBoardIdToEdit={newBoardIdToEdit}
            onEditModeEntered={() => setNewBoardIdToEdit(null)}
          />
        </div>
        <div className="header-right">
          <i className="fas fa-bell"></i>
          <i className="fas fa-question-circle"></i>
          <ProfileDropdown />
        </div>
      </header>

      <main className={`task-board-main ${isOverDeleteZone ? 'no-scroll' : ''}`}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <SortableContext items={columns.map(col => col.id)}>
            {columns.map(column => (
              <Column
                key={column.id}
                column={column}
                cards={cards.filter(card => card.column === column.id)}
                editingColumnId={editingColumnId}
                setEditingColumnId={setEditingColumnId}
                updateColumnTitle={updateColumnTitle}
                exitingItemIds={exitingItemIds}
                onCardKeyDown={handleCardCreationKeyDown}
                onToggleOptions={handleToggleColumnOptions}
              />
            ))}
          </SortableContext>
          <DeleteZone />
          <DragOverlay>
            {activeCard ? (
              <Card card={activeCard} />
            ) : activeColumn ? (
              <Column
                column={activeColumn}
                cards={cards.filter(card => card.column === activeColumn.id)}
                exitingItemIds={exitingItemIds}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        {activeDropdown.columnId && (
          <ColumnOptionsDropdown
            position={activeDropdown.position}
            onClose={() => setActiveDropdown({ columnId: null, position: null })}
            onRename={() => {
              setEditingColumnId(activeDropdown.columnId);
              setActiveDropdown({ columnId: null, position: null });
            }}
            onDelete={() => {
              handleDeleteColumnRequest(activeDropdown.columnId);
              setActiveDropdown({ columnId: null, position: null });
            }}
            onColorChange={(color) => {
              updateColumnColor(activeDropdown.columnId, color);
              setActiveDropdown({ columnId: null, position: null });
            }}
          />
        )}

        <div className="add-column-container">
          <div className="add-column-btn" onClick={addColumn}>
            <i className="fas fa-plus"></i> Añadir otra lista
          </div>
        </div>
      </main>

      <footer className="task-board-footer">
        <p><i className="fas fa-angle-left"></i> Backdoor Site code</p>
      </footer>

      <ConfirmationModal
        isOpen={!!columnToDelete}
        onConfirm={confirmDeleteColumn}
        onCancel={() => setColumnToDelete(null)}
        title="Eliminar Columna"
        message="¿Estás seguro de que quieres eliminar esta columna? Todas las tarjetas dentro de ella también serán eliminadas. Esta acción no se puede deshacer."
      />

      <ConfirmationModal
        isOpen={!!boardToDelete}
        onConfirm={confirmDeleteBoard}
        onCancel={() => setBoardToDelete(null)}
        title="Eliminar Tablero"
        message="¿Estás seguro de que quieres eliminar este tablero? Esta acción no se puede deshacer."
      />
    </div>
  );
}
