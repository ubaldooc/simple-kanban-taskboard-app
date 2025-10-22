import React from "react";

const LoggingOutModal = ({ isOpen }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-info">
        <div className="spinner"></div>
        <h2>Cerrando sesión...</h2>
      </div>
    </div>
  );
};

export default LoggingOutModal;
