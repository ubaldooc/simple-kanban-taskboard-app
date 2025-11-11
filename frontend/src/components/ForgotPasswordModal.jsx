import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Enfocar el input cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      // Pequeño retraso para asegurar que el modal sea visible antes de enfocar
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Limpiar el estado cuando el modal se cierra
      setEmail('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Cerrar el modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, ingresa tu correo electrónico.');
      return;
    }
    setIsLoading(true);

    try {
      // Llamada real al endpoint del backend
      const { data } = await apiClient.post('/auth/forgot-password', { email });
      toast.success(data.message, { duration: 6000 });
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al enviar el correo.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <h2>Recuperar Contraseña</h2>
        <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email">Correo Electrónico</label>
            <input
              ref={inputRef}
              type="email"
              id="reset-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.com"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-btn modal-btn-cancel" disabled={isLoading}>Cancelar</button>
            <button type="submit" className="modal-btn modal-btn-confirm" disabled={isLoading}>{isLoading ? 'Enviando...' : 'Enviar Enlace'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;