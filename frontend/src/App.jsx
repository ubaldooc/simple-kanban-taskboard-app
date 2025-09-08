import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import './App.css';
import Column from './components/Column.jsx';
import Card from './components/Card.jsx';
import DeleteZone from './components/DeleteZone.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import profileImage from './profile.png';

// --- Helper Functions ---

// Function to get initial state from localStorage
const getInitialState = (key, defaultValue) => {
  const savedState = localStorage.getItem(key);
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// --- Initial Data Migration ---

const initialBoardsData = () => {
  // 1. Primero, intenta cargar desde el nuevo formato 'taskboards'.
  const savedBoards = getInitialState('taskboards', null);
  // Si existen datos en el nuevo formato y no están vacíos, los usamos.
  if (savedBoards && savedBoards.length > 0) {
    return savedBoards;
  }

  // 2. Si no hay datos en el nuevo formato, intenta migrar desde el formato antiguo.
  const oldColumns = getInitialState('taskboard-columns', null);
  const oldCards = getInitialState('taskboard-cards', null);

  if (oldColumns && oldCards) {
    const migratedBoards = [{
      id: `board-${Date.now()}`,
      title: 'Tablero Principal',
      columns: oldColumns,
      cards: oldCards,
    }];
    return migratedBoards; // Retornar los datos migrados para que se usen.
  }

  // 3. Si no hay datos guardados en ningún formato, usa los datos iniciales por defecto.
  return [{
    id: `board-${Date.now()}`,
    title: 'Mi Primer Tablero',
    columns: [
      { id: 'ideas', title: 'Ideas', color: '#AB47BC' },
      { id: 'todo', title: 'To Do', color: '#42A5F5' },
      { id: 'in-progress', title: 'In Progress', color: '#FF7043' },
      { id: 'done', title: 'Done', color: '#66BB6A' },
    ],
    cards: [
      { id: '1', title: '¡Bienvenido a tu nuevo tablero!', column: 'ideas' },
      { id: '2', title: 'Arrastra esta tarjeta a "To Do"', column: 'ideas' },
    ],
  }];
};


function App() {
  // --- State Management ---
  const [boards, setBoards] = useState(initialBoardsData);
  const [activeBoardId, setActiveBoardId] = useState(() => boards[0]?.id);

  const [active, setActive] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [exitingItemIds, setExitingItemIds] = useState([]);

  // --- Derived State ---
  const activeBoard = boards.find(b => b.id === activeBoardId);
  const columns = activeBoard ? activeBoard.columns : [];
  const cards = activeBoard ? activeBoard.cards : [];

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('taskboards', JSON.stringify(boards));
  }, [boards]);

  // --- DND Kit Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const ANIMATION_DURATION = 400;

  // --- Helper to update the active board ---
  const updateActiveBoard = (updater) => {
    setBoards(prevBoards =>
      prevBoards.map(board =>
        board.id === activeBoardId ? updater(board) : board
      )
    );
  };

  // --- Board Management ---
  const addBoard = () => {
    const newBoardName = prompt("Introduce el nombre del nuevo tablero:");
    if (newBoardName) {
      const newBoard = {
        id: `board-${Date.now()}`,
        title: newBoardName,
        columns: [
            { id: `col-${Date.now()}`, title: 'To Do', color: '#42A5F5' }
        ],
        cards: [],
      };
      setBoards(prevBoards => [...prevBoards, newBoard]);
      setActiveBoardId(newBoard.id);
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

  // --- Item Management Functions ---
  const addColumn = () => {
    const newColumn = { id: `col-${Date.now()}`, title: '', color: '#8b949e' };
    updateActiveBoard(board => ({ ...board, columns: [...board.columns, newColumn] }));
    setEditingColumnId(newColumn.id);
  };

  const addCard = (columnId) => {
    const newCard = { id: `${Date.now()}`, title: '', column: columnId };
    updateActiveBoard(board => ({ ...board, cards: [...board.cards, newCard] }));
    setEditingCardId(newCard.id);
  };

  const updateCardTitle = (id, newTitle) => {
    updateActiveBoard(board => ({
      ...board,
      cards: board.cards.map(c => c.id === id ? { ...c, title: newTitle } : c)
    }));
  };

  const updateColumnTitle = (id, newTitle) => {
    updateActiveBoard(board => ({
      ...board,
      columns: board.columns.map(c => c.id === id ? { ...c, title: newTitle } : c)
    }));
  };

  const updateColumnColor = (id, newColor) => {
    updateActiveBoard(board => ({
      ...board,
      columns: board.columns.map(c => c.id === id ? { ...c, color: newColor } : c)
    }));
  };

  const handleDeleteColumnRequest = (columnId) => setColumnToDelete(columnId);

  const confirmDeleteColumn = () => {
    if (columnToDelete) {
      setExitingItemIds(prev => [...prev, columnToDelete]);
      setColumnToDelete(null);
      setTimeout(() => {
        updateActiveBoard(board => ({
          ...board,
          columns: board.columns.filter(col => col.id !== columnToDelete),
          cards: board.cards.filter(card => card.column !== columnToDelete),
        }));
      }, ANIMATION_DURATION);
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
          <i className="fas fa-th-large"></i>
          <div className="board-selector">
            <select value={activeBoardId} onChange={(e) => setActiveBoardId(e.target.value)}>
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.title}</option>
              ))}
            </select>
            <button onClick={addBoard} className="add-board-btn">+</button>
          </div>
        </div>
        <div className="header-right">
          <i className="fas fa-bell"></i>
          <i className="fas fa-question-circle"></i>
          <img src={profileImage} alt="User Avatar" className="avatar" />
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
                onAddCard={addCard}
                updateCardTitle={updateCardTitle}
                editingCardId={editingCardId}
                clearEditingCardId={() => setEditingCardId(null)}
                onDeleteColumn={handleDeleteColumnRequest}
                editingColumnId={editingColumnId}
                setEditingColumnId={setEditingColumnId}
                updateColumnTitle={updateColumnTitle}
                updateColumnColor={updateColumnColor}
                exitingItemIds={exitingItemIds}
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
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
    </div>
  );
}

export default App;
