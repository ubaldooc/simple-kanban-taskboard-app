import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import "../App.css";
import Column from "./Column.jsx";
import Card from "./Card.jsx";
import DeleteZone from "./DeleteZone.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import useHotkeys from "../hooks/useHotkeys.js";
import ColumnOptionsDropdown from "./ColumnOptionsDropdown.jsx";
import BoardSelector from "./BoardSelector.jsx";

import LoggingOutModal from "./LoggingOutModal.jsx";
import ProfileDropdown from "./ProfileDropdown.jsx";
import HelpModal from "./HelpModal.jsx";
import logoImage from "../assets/logo-dark.webp";
import WallpaperModal from "./WallpaperModal.jsx";
import { useTaskboardContext } from "../context/TaskboardContext";
import Loader from "./Loader.jsx"; // <-- 1. Importamos el nuevo componente
import { useAuth } from "../context/AuthContext.jsx";
import { useTaskboardDnd } from "../hooks/useTaskboardDnd";
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
    newBoardIdToEdit,
    setNewBoardIdToEdit,
    updateActiveBoard,
    slideDirection,
    nextBoard,
    prevBoard
  } = useTaskboardContext();
  const { user, authMode } = useAuth();
  const navigate = useNavigate();

  const { isLoggingOut } = useAuth(); // <-- 2. Obtener isLoggingOut desde AuthContext

  const [activeDropdown, setActiveDropdown] = useState({
    columnId: null,
    position: null,
  });
  const mainContainerRef = useRef(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); // <-- 2. Estado para el modal de ayuda
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

  const {
    active,
    isDragging,
    isOverDeleteZone,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    dragItemStyles, // <-- 1. Importamos los estilos del elemento arrastrado
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
  const hotkeys = useMemo(
    () => ({
      "n": addColumn,
      "[": prevBoard,
      "]": nextBoard,
    }),
    [addColumn, nextBoard, prevBoard]
  );
  useHotkeys(hotkeys);

  // --- Animation Variants ---
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "50%" : direction < 0 ? "-50%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? "50%" : direction > 0 ? "-50%" : 0,
      opacity: 0,
      transition: { duration: 0.2 }
    }),
  };

  if (isLoading) {
    return <Loader />; // <-- 2. Usamos el nuevo componente
  }

  // --- Render Logic ---
  const activeCard =
    active &&
    active.data.current?.type === "Card" &&
    cards.find((c) => c.id === active.id);
  const activeColumn =
    active &&
    active.data.current?.type === "Column" &&
    columns.find((c) => c.id === active.id);

  // Determina si se está arrastrando una tarjeta para mostrar la zona de eliminación
  const isCardDragging = isDragging && active?.data.current?.type === "Card";

  return (
    <div
      className={`task-board-container ${isDragging ? "is-dragging" : ""} ${
        isCardDragging ? "is-dragging-card" : ""
      }`}
    >
      {/* Contenedor para las notificaciones flotantes */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
          },
          duration: 4000, // Duración por defecto para todos los toasts.
          success: {
            duration: 3000,
          },
        }}
      />

      <header className="task-board-header">
        <div className="header-left">
          <img src={logoImage} alt="Taskboard Logo" className="header-logo" draggable="false" />
          <BoardSelector />
        </div>
        <div className="header-right">
          {authMode === "online" && user ? (
            <span className="user-greeting">
              Hola, {user.name.split(" ")[0]}
            </span>
          ) : (
            <div className="guest-login-prompt">
              <button
                className="header-login-btn"
                onClick={() => navigate("/login")}
              >
                Iniciar sesión
              </button>
              <span>¡para trabajar desde cualquier dispositivo!</span>
            </div>
          )}
          <ProfileDropdown
            onOpenHelpModal={() => setIsHelpModalOpen(true)}
            onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
          />
        </div>
      </header>

      <main
        ref={mainContainerRef}
        className={`task-board-main ${isOverDeleteZone ? "no-scroll" : ""}`}
      >
        <AnimatePresence mode="popLayout" custom={slideDirection} initial={false}>
          <motion.div
            key={activeBoardId}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="task-board-main-animated-wrapper"
          >
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              autoScroll={active?.data.current?.type !== "Column"}
              collisionDetection={closestCenter}
            >
              <SortableContext items={columns.map((col) => col.id)}>
                {columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    cards={cards.filter((card) => card.column === column.id)}
                    onToggleOptions={handleToggleColumnOptions}
                  />
                ))}
              </SortableContext>
              <DeleteZone />
              {/* Aplicamos los estilos y una clase específica para la columna */}
              <DragOverlay
                style={dragItemStyles}
                className={
                  activeColumn
                    ? "dnd-overlay-column"
                    : activeCard
                    ? "dnd-overlay-card"
                    : ""
                }
              >
                {activeCard ? (
                  <Card card={activeCard} />
                ) : activeColumn ? (
                  <Column
                    column={activeColumn}
                    // Pasamos un array vacío para no renderizar las tarjetas en el overlay.
                    cards={[]}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        </AnimatePresence>
        {activeDropdown.columnId && mainContainerRef.current && (
          <ColumnOptionsDropdown
            container={mainContainerRef.current}
            position={activeDropdown.position}
            onClose={() =>
              setActiveDropdown({ columnId: null, position: null })
            }
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

        {activeBoard && (
          <div className="add-column-container">
            <div className="add-column-btn" onClick={addColumn}>
              <i className="fas fa-plus"></i> Añadir otra lista
            </div>
          </div>
        )}
      </main>

      <footer className="task-board-footer">
        <p>
          <i className="fas fa-angle-left"></i> Backdoor Site code
        </p>
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

      <LoggingOutModal isOpen={isLoggingOut} />

      {/* 4. Renderizamos el modal de ayuda */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
      />
    </div>
  );
};
