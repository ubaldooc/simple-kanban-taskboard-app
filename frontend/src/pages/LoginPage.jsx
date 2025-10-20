import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Estilos para el formulario
import logoImage from '../assets/logo.png'; // Importamos el logo

const LoginPage = () => {
  const { user, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Si el usuario ya está logueado (p.ej. por una sesión previa guardada),
  // lo redirigimos inmediatamente al dashboard principal para que no vea el login.
  useEffect(() => {
    if (user) {
      // Redirige a la página anterior o a la principal
      navigate(-1, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let result;
    if (isRegisterView) {
      // NOTA: La ruta para este registro aún no existe en tu backend.
      result = await register(name, email, password);
    } else {
      result = await login(email, password);
    }

    if (!result.success) {
      setError(result.message || 'Ocurrió un error.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <img src={logoImage} alt="Taskboard Logo" className="login-logo" />
        <h1>{isRegisterView ? 'Crear Cuenta' : 'Iniciar Sesión'}</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          {isRegisterView && (
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />
              <i
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`}
                onClick={() => setShowPassword(!showPassword)}></i>
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button">{isRegisterView ? 'Registrarse' : 'Iniciar Sesión'}</button>
        </form>

        <div className="divider">
          <span>O</span>
        </div>

        <button onClick={() => loginWithGoogle()} className="google-login-button">
          <span className="google-icon"></span>
          <span>Iniciar Sesión con Google</span>
        </button>

        <div className="auth-switch">
          {isRegisterView ? (
            <>¿Ya tienes una cuenta? <span onClick={() => setIsRegisterView(false)}>Inicia sesión</span></>
          ) : (
            <>¿No tienes una cuenta? <span onClick={() => setIsRegisterView(true)}>Regístrate</span></>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;