import React from "react";
import "./LoggingOutModal.css";

const LoggingOutModal = () => {
  return (
    <div className="logging-out-modal-overlay">
      <div className="logging-out-modal-content">
        <div className="spinner"></div>
        <h2>Cerrando sesión...</h2>
      </div>
    </div>
  );
};

export default LoggingOutModal;
