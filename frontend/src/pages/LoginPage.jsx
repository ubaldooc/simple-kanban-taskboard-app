import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Estilos para el formulario
import logoImage from '../assets/logo.png'; // Importamos el logo

const LoginPage = () => {
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    // NOTA: La ruta para este login aún no existe en tu backend.
    // Deberás crearla para que esta funcionalidad sea completa.
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <img src={logoImage} alt="Taskboard Logo" className="login-logo" />
        <h1>Iniciar Sesión</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button">Iniciar Sesión</button>
        </form>

        <div className="divider">
          <span>O</span>
        </div>

        <button onClick={() => loginWithGoogle()} className="google-button">
          <i className="fab fa-google"></i>
          <span>Iniciar Sesión con Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;