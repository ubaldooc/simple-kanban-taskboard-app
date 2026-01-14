import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendFeedback } from '../services/apiService';
import toast from 'react-hot-toast';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Por favor, escribe un comentario.');
      return;
    }

    setIsSending(true);
    try {
      await sendFeedback({ 
        message, 
        email: user ? user.email : undefined 
      });
      toast.success('¡Gracias por tus comentarios!');
      setMessage('');
      onClose();
    } catch (error) {
      toast.error('Error al enviar. Inténtalo de nuevo.');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <i className="fas fa-comment-alt"></i> Enviar Comentarios
        </h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          ¿Tienes alguna sugerencia o encontraste un error? ¡Cuéntanos!
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            className="feedback-textarea"
            rows="5"
            placeholder="Escribe tu mensaje aquí..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            autoFocus
          ></textarea>

          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-btn modal-btn-cancel" 
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-btn modal-btn-confirm" 
              disabled={isSending}
            >
              {isSending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
