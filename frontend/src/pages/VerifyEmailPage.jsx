import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import './VerifyEmailPage.css';
import logoImage from '../assets/logo.webp';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se proporcionó un token de verificación.');
      return;
    }

    const verifyAccount = async () => {
      try {
        const { data } = await apiClient.post(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(data.message);
        // Redirige al login después de unos segundos
        setTimeout(() => {
          navigate('/login');
        }, 4000);
      } catch (error) {
        setStatus('error');
        const errorMessage = error.response?.data?.message || 'Ocurrió un error al verificar tu cuenta.';
        setMessage(errorMessage);
      }
    };

    verifyAccount();
  }, [token, navigate]);

  return (
    <div className="verification-page-container">
      <div className="verification-box">
        <img src={logoImage} alt="Taskboard Logo" className="login-logo" />
        <h1>Verificación de Cuenta</h1>
        <div className={`status-icon ${status}`}>
          {status === 'verifying' && <div className="spinner"></div>}
          {status === 'success' && <i className="fas fa-check-circle"></i>}
          {status === 'error' && <i className="fas fa-times-circle"></i>}
        </div>
        <p className={`status-message ${status}`}>{message}</p>
        {status === 'error' && (
          <button onClick={() => navigate('/login')} className="submit-button">Ir a Iniciar Sesión</button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;