import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import './App.css';
import Column from './components/Column.jsx';
import Card from './components/Card.jsx';
import DeleteZone from './components/DeleteZone.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import useHotkeys from './hooks/useHotkeys.js';
import ColumnOptionsDropdown from './components/ColumnOptionsDropdown.jsx';
import BoardSelector from './components/BoardSelector.jsx'; // Importar el nuevo componente
import ProfileDropdown from './components/ProfileDropdown.jsx';
import logoImage from './assets/logo.png'; // 1. Importar el logo

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
      id: `board-${crypto.randomUUID()}`,
      title: 'Tablero Principal',
      columns: oldColumns,
      cards: oldCards,
    }];
    return migratedBoards; // Retornar los datos migrados para que se usen.
  }

  // 3. Si no hay datos guardados en ningún formato, usa los datos iniciales por defecto.
  return [{
    id: `board-${crypto.randomUUID()}`,
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
  const [boards, setBoards] = useState(initialBoardsData); // inicializa la variable con el array de tableros
  const [activeBoardId, setActiveBoardId] = useState(() => boards[0]?.id); // inicializa el ID del primer tablero con inicialización diferida (lazy initialization) para esperar a que la variable boards obtenga los tableros.

  const [active, setActive] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null); // Nuevo estado para eliminar tableros
  const [boardToEdit, setBoardToEdit] = useState(null); // Nuevo estado para editar tableros
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [exitingItemIds, setExitingItemIds] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState({ columnId: null, position: null });

  // --- Derived State ---
  const activeBoard = boards.find(b => b.id === activeBoardId); // busca el json del tablero activo en el array de tableros boards
  const columns = activeBoard ? activeBoard.columns : []; // busca las columnas del tablero en el json, si no hay retorna un array vacio
  const cards = activeBoard ? activeBoard.cards : []; // busca las tarjetas del tablero en el json, si no hay retorna un array vacio

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

  // --- Helper to update the active board / Actualiza el tablero actual ---
  const updateActiveBoard = (updater) => {
    setBoards(prevBoards => prevBoards.map(board => board.id === activeBoardId ? updater(board) : board));
  };

  // --- Board Management / Gestion de Tableros (crear, cambiar) ---
  const addBoard = () => {
    const newBoardName = prompt("Introduce el nombre del nuevo tablero:");
    if (newBoardName) {
      const newBoard = {
        id: `board-${crypto.randomUUID()}`,
        title: newBoardName,
        columns: [
            { id: `col-${crypto.randomUUID()}`, title: 'To Do', color: '#42A5F5' }
        ],
        cards: [],
      };
      setBoards(prevBoards => [...prevBoards, newBoard]);
      setActiveBoardId(newBoard.id);
    }
  };

  const editBoard = (boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      const newTitle = prompt("Introduce el nuevo nombre para el tablero:", board.title);
      if (newTitle && newTitle.trim() !== '') {
        setBoards(prevBoards =>
          prevBoards.map(b => (b.id === boardId ? { ...b, title: newTitle.trim() } : b))
        );
      }
    }
  };

  const requestDeleteBoard = (boardId) => {
    setBoardToDelete(boardId);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      const newBoards = boards.filter(b => b.id !== boardToDelete);
      setBoards(newBoards);
      // Si el tablero eliminado era el activo, activa el primero de la lista
      if (activeBoardId === boardToDelete) {
        setActiveBoardId(newBoards[0]?.id || null);
      }
      setBoardToDelete(null);
    }
  };


  // --- Item Management Functions ---
  const addColumn = () => {
    const newColumn = { id: `col-${crypto.randomUUID()}`, title: '', color: '#8b949e' };
    updateActiveBoard(board => ({ ...board, columns: [...board.columns, newColumn] }));
    setEditingColumnId(newColumn.id);
  };

  const addCard = (columnId) => {
    const newCard = { id: `${crypto.randomUUID()}`, title: '', column: columnId };
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
  }), [boards, activeBoardId, addColumn]);

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
          <img src={logoImage} alt="Taskboard Logo" className="header-logo" /> {/* 2. Añadir la imagen del logo */}
          <BoardSelector
            boards={boards}
            activeBoard={activeBoard}
            onBoardSelect={setActiveBoardId}
            onBoardAdd={addBoard}
            onBoardEdit={editBoard}
            onBoardDelete={requestDeleteBoard}
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
                onAddCard={addCard}
                updateCardTitle={updateCardTitle}
                editingCardId={editingCardId}
                clearEditingCardId={() => setEditingCardId(null)}
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

export default App;
