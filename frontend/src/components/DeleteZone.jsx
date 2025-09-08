import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DeleteZone = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'delete-zone',
  });

  return (
    <div ref={setNodeRef} className={`delete-zone ${isOver ? 'is-over' : ''}`}>
      <i className="fas fa-trash-alt"></i>
      <span>Eliminar</span>
    </div>
  );
};

export default DeleteZone;