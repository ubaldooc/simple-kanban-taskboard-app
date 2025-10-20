import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Si el usuario ya está logueado (p.ej. por una sesión previa guardada),
  // lo redirigimos inmediatamente al dashboard principal para que no vea el login.
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', background: '#f0f2f5' }}>
      <div style={{ padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1>Bienvenido al Taskboard</h1>
        <p style={{ marginBottom: '24px', color: '#666' }}>Por favor, inicia sesión para continuar.</p>
        <button onClick={() => loginWithGoogle()} style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', border: 'none', background: '#4285F4', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fab fa-google"></i>
          <span>Iniciar Sesión con Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;