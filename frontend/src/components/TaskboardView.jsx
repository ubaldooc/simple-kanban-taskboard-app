import React, { useState, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import '../App.css';
import Column from './Column.jsx';
import Card from './Card.jsx';
import DeleteZone from './DeleteZone.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import useHotkeys from '../hooks/useHotkeys.js';
import ColumnOptionsDropdown from './ColumnOptionsDropdown.jsx';
import { Toaster } from 'react-hot-toast';
import BoardSelector from './BoardSelector.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import logoImage from '../assets/logo.png';
import { useTaskboardContext } from '../context/TaskboardContext';
import { useTaskboardDnd } from '../hooks/useTaskboardDnd';

export const TaskboardView = () => {
  const {
    boards,
    activeBoard,
    columns,
    cards,
    activeBoardId,
    setActiveBoardId,
    addBoard,
    requestDeleteBoard,
    confirmDeleteBoard,
    boardToDelete,
    setBoardToDelete,
    addColumn,
    addCard,
    updateColumnColor,
    isLoading,
    handleDeleteColumnRequest,
    confirmDeleteColumn,
    columnToDelete,
    setColumnToDelete,
    setEditingColumnId,
    exitingItemIds,
  } = useTaskboardContext();

  const [activeDropdown, setActiveDropdown] = useState({ columnId: null, position: null });
  const mainContainerRef = useRef(null);

  const {
    active,
    isDragging,
    isOverDeleteZone,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useTaskboardDnd();

  // --- DND Kit Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // El arrastre se inicia después de que el puntero se mueva 5 píxeles.
    activationConstraint: { distance: 5 },
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

  if (isLoading) {
      return (
      <div>Loading...</div>
    )
  }

  // --- Render Logic ---
  const activeCard = active && active.data.current?.type === 'Card' && cards.find(c => c.id === active.id);
  const activeColumn = active && active.data.current?.type === 'Column' && columns.find(c => c.id === active.id);

  // Determina si se está arrastrando una tarjeta para mostrar la zona de eliminación
  const isCardDragging = isDragging && active?.data.current?.type === 'Card';

  return (
      <div className={`task-board-container ${isDragging ? 'is-dragging' : ''} ${isCardDragging ? 'is-dragging-card' : ''}`}>
        {/* Contenedor para las notificaciones flotantes */}
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              duration: 3000,
            },
          }}
        />
        <header className="task-board-header">
          <div className="header-left">
            <img src={logoImage} alt="Taskboard Logo" className="header-logo" />
            <BoardSelector />
          </div>
          <div className="header-right">
            <i className="fas fa-bell"></i>
            <i className="fas fa-question-circle"></i>
            <ProfileDropdown />
          </div>
        </header>

        <main ref={mainContainerRef} className={`task-board-main ${isOverDeleteZone ? 'no-scroll' : ''}`}>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
          >
            <SortableContext items={columns.map(col => col.id)}>
              {columns.map(column => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards.filter(card => card.column === column.id)}
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
          {activeDropdown.columnId && mainContainerRef.current && (
            <ColumnOptionsDropdown
              container={mainContainerRef.current}
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
  };
