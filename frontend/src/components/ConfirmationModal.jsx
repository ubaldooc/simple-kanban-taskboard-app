import React from 'react';

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn modal-btn-cancel">
            Cancelar
          </button>
          <button onClick={onConfirm} className="modal-btn modal-btn-confirm">
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;