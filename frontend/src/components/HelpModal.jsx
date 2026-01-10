import React from "react";

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>
          <i className="fas fa-question-circle"></i> Ayuda y Atajos de Teclado
        </h2>

        <div className="help-section">
          <h3>Funcionalidades Principales</h3>
          <ul>
            <li>
              <i className="fas fa-arrows-alt"></i>{" "}
              <strong>Arrastrar y Soltar:</strong> Puedes reordenar tableros,
              columnas y tarjetas simplemente arrastrándolos a su nueva
              posición.
            </li>
            <li>
              <i className="fas fa-trash-alt"></i>{" "}
              <strong>Eliminar Tarjetas:</strong> Arrastra una tarjeta hacia la
              zona roja que aparece a la derecha para eliminarla.
            </li>
            <li>
              <i className="fas fa-edit"></i> <strong>Edición Rápida:</strong>{" "}
              Haz doble clic en el título de una columna o tarjeta para editarlo
              directamente. Presiona 'Enter' para guardar o 'Esc' para cancelar.
            </li>
            <li>
              <i className="fas fa-palette"></i>{" "}
              <strong>Personalizar Columnas:</strong> Usa el menú de opciones de
              cada columna (icono <i className="fas fa-ellipsis-h"></i>) para
              cambiar su color o eliminarla.
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h3>Atajos de Teclado</h3>
          <ul className="shortcuts-list">
            <li>
              <span className="key-combo">N</span>
              <span className="key-desc">
                Añadir una nueva columna al tablero actual.
              </span>
            </li>
            <li>
              <span className="key-combo">[</span>
              <span className="key-desc">Cambiar al tablero anterior.</span>
            </li>
            <li>
              <span className="key-combo">]</span>
              <span className="key-desc">Cambiar al siguiente tablero.</span>
            </li>
          </ul>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-confirm" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
