import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import apiClient from '../api/axios'; // Importamos apiClient
import './ResetPasswordPage.css';
import logoImage from '../assets/logo.webp';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validamos el token al cargar la página para dar feedback rápido al usuario.
  // Esto es opcional pero mejora la UX. La validación final se hace al enviar.
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Podrías crear un endpoint GET /reset-password/:token para solo verificar,
        // pero por simplicidad, podemos omitirlo y validar solo al enviar.
        // Si el token no es válido, el usuario lo sabrá al intentar cambiar la contraseña.
      } catch (error) {
        toast.error('El enlace es inválido o ha expirado. Serás redirigido.', { duration: 5000 });
        setTimeout(() => navigate('/login'), 5000);
      }
    };
    if (token) {
      // verifyToken(); // Descomentar si implementas el endpoint de verificación
    }
  }, [token, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await apiClient.post(`/auth/reset-password/${token}`, { password });
      toast.success(data.message + ' Serás redirigido...', { duration: 4000 });
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'No se pudo restablecer la contraseña.';
      toast.error(errorMessage);
      setIsLoading(false);
    }
    // No ponemos setIsLoading(false) en el 'try' porque la redirección ya se encarga
    // de desmontar el componente.
  };

  return (
    <div className="reset-password-page-container">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <div className="reset-password-box">
        <img src={logoImage} alt="Taskboard Logo" className="login-logo" />
        <h1>Restablecer Contraseña</h1>
        <p className="reset-password-subtitle">Ingresa tu nueva contraseña.</p>
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="new-password">Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <i
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`}
                onClick={() => !isLoading && setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;