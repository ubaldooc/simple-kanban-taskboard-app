import React from "react";

const AuthLoadingModal = ({ isOpen, isRegistering }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-info">
        <div className="spinner"></div>
        <h2>{isRegistering ? "Creando cuenta..." : "Iniciando sesión..."}</h2>
      </div>
    </div>
  );
};

export default AuthLoadingModal;
