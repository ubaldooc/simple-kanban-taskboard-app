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
        <div className={`form-container ${isRegisterView ? 'show-register' : ''}`}>
          {/* --- Formulario de Iniciar Sesión --- */}
          <div className="form-section form-login">
            <img src={logoImage} alt="Taskboard Logo" className="login-logo" />
            <h1>Iniciar Sesión</h1>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="login-email">Correo Electrónico</label>
                <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Contraseña</label>
                <div className="password-input-wrapper">
                  <input type={showPassword ? "text" : "password"} id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`} onClick={() => setShowPassword(!showPassword)}></i>
                </div>
              </div>
              {error && !isRegisterView && <p className="error-message">{error}</p>}
              <button type="submit" className="submit-button">Iniciar Sesión</button>
            </form>
            <div className="divider"><span>O</span></div>
            <button onClick={() => loginWithGoogle()} className="google-login-button"><span className="google-icon"></span><span>Iniciar Sesión con Google</span></button>
          </div>

          {/* --- Formulario de Registro --- */}
          <div className="form-section form-register">
            <img src={logoImage} alt="Taskboard Logo" className="login-logo" />
            <h1>Crear Cuenta</h1>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="register-name">Nombre</label>
                <input type="text" id="register-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="register-email">Correo Electrónico</label>
                <input type="email" id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="register-password">Contraseña</label>
                <input type="password" id="register-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && isRegisterView && <p className="error-message">{error}</p>}
              <button type="submit" className="submit-button">Registrarse</button>
            </form>
            <div className="divider"><span>O</span></div>
            <button onClick={() => loginWithGoogle()} className="google-login-button"><span className="google-icon"></span><span>Iniciar Sesión con Google</span></button>
          </div>
        </div>
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