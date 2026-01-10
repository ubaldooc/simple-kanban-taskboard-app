# 🔒 Sistema de Protección de Rutas de Autenticación

## Resumen
Este documento explica cómo funciona la protección de doble capa (frontend + backend) para evitar que usuarios autenticados accedan a las rutas de login/registro.

---

## 🎯 Objetivo
Prevenir que usuarios que ya han iniciado sesión puedan:
- Acceder a `/login` escribiendo la URL manualmente
- Volver a `/login` usando el botón "atrás" del navegador
- Hacer peticiones a las rutas de autenticación desde la API

---

## 🛡️ Capa 1: Protección del Frontend

### Archivo: `frontend/src/pages/LoginPage.jsx`

**Líneas 24-33:**
```javascript
useEffect(() => {
  if (user) {
    // Redirige directamente a la página principal (reemplaza la entrada en el historial)
    navigate('/', { replace: true });
  }
}, [user, navigate]);
```

**Cómo funciona:**
1. Cuando `LoginPage` se monta, verifica si hay un usuario autenticado
2. Si `user` existe → redirige inmediatamente a `/` (página principal)
3. Usa `replace: true` para reemplazar la entrada en el historial (evita bucles)
4. El usuario **nunca ve** la pantalla de login

**Escenarios cubiertos:**
- ✅ Usuario escribe `/login` en la barra de direcciones
- ✅ Usuario da "atrás" y llega a `/login`
- ✅ Usuario hace clic en un enlace a `/login`

---

## 🛡️ Capa 2: Protección del Backend

### Archivo: `backend/src/middleware/rejectAuthenticated.js`

**Middleware completo:**
```javascript
export const rejectAuthenticated = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Si el token es válido, el usuario está autenticado
      return res.status(403).json({ 
        code: 'ALREADY_AUTHENTICATED',
        message: 'Ya has iniciado sesión. No puedes acceder a esta página.' 
      });
    } catch (error) {
      // Token inválido o expirado → el usuario puede continuar
      return next();
    }
  }

  // Sin token → el usuario puede continuar
  next();
};
```

**Cómo funciona:**
1. Verifica si la petición incluye un `Authorization` header con un token
2. Si el token es **válido** → rechaza la petición con error 403
3. Si el token es **inválido/expirado** → permite continuar (usuario no autenticado)
4. Si **no hay token** → permite continuar

### Aplicación en rutas (backend/index.js):

```javascript
// Línea 21
import { rejectAuthenticated } from './src/middleware/rejectAuthenticated.js';

// Línea 850
app.post('/api/auth/google', rejectAuthenticated, async (req, res) => { ... });

// Línea 910
app.post('/api/auth/register', rejectAuthenticated, authLimiter, async (req, res) => { ... });

// Línea 1051
app.post('/api/auth/login', rejectAuthenticated, authLimiter, async (req, res) => { ... });
```

**Rutas protegidas:**
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/register`
- ✅ `POST /api/auth/google`

---

## 🔄 Manejo en el Frontend

### Archivo: `frontend/src/context/AuthContext.jsx`

**Líneas 126-133:**
```javascript
if (error.response?.status === 403 && error.response?.data?.code === 'ALREADY_AUTHENTICATED') {
  console.log('Usuario autenticado intentó acceder a ruta de autenticación');
  // No mostramos error, simplemente lo manejamos silenciosamente
  // El componente LoginPage ya redirige en el useEffect
  return Promise.reject(error);
}
```

**Cómo funciona:**
1. El interceptor de Axios detecta errores 403 con código `ALREADY_AUTHENTICATED`
2. Lo registra en consola para debugging
3. No muestra ningún mensaje de error al usuario (UX fluida)
4. El `LoginPage` ya maneja la redirección automáticamente

---

## 📊 Flujo Completo

### Caso 1: Usuario autenticado escribe `/login` en la barra

```
1. Navegador carga LoginPage.jsx
2. useEffect detecta que user !== null
3. navigate('/', { replace: true })
4. Usuario ve la página principal
5. Entrada de /login se reemplaza en el historial
```

### Caso 2: Usuario autenticado intenta hacer petición a /api/auth/login

```
1. Frontend envía POST /api/auth/login con Authorization header
2. Middleware rejectAuthenticated verifica el token
3. Token es válido → Backend responde 403 ALREADY_AUTHENTICATED
4. Interceptor de Axios detecta el error
5. No muestra mensaje al usuario
6. LoginPage redirige automáticamente
```

### Caso 3: Usuario NO autenticado accede a /login

```
1. Navegador carga LoginPage.jsx
2. useEffect detecta que user === null
3. No hace nada, muestra el formulario de login
4. Usuario puede iniciar sesión normalmente
```

---

## 🎨 Ventajas de este Enfoque

### ✅ Doble Capa de Seguridad
- Frontend: Previene navegación innecesaria
- Backend: Previene peticiones maliciosas

### ✅ Experiencia de Usuario Fluida
- Sin mensajes de error molestos
- Redirección instantánea
- Sin bucles de navegación

### ✅ Seguridad Robusta
- Imposible bypassear la protección del frontend
- El backend siempre valida el token
- Protección contra peticiones directas a la API

### ✅ Mantenible
- Middleware reutilizable
- Lógica centralizada
- Fácil de extender a nuevas rutas

---

## 🧪 Cómo Probar

### Test 1: Usuario autenticado intenta acceder a /login
1. Inicia sesión en la aplicación
2. Escribe manualmente `http://localhost:5173/login` en la barra
3. **Resultado esperado:** Redirige inmediatamente a `/`

### Test 2: Usuario autenticado usa botón "atrás"
1. Inicia sesión en la aplicación
2. Navega a otra página
3. Presiona el botón "atrás" del navegador hasta llegar a /login
4. **Resultado esperado:** Redirige inmediatamente a `/`

### Test 3: Petición directa a la API
1. Abre DevTools → Console
2. Ejecuta:
```javascript
fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  },
  body: JSON.stringify({ email: 'test@test.com', password: '123456' })
})
.then(r => r.json())
.then(console.log);
```
3. **Resultado esperado:** Error 403 con código `ALREADY_AUTHENTICATED`

---

## 📝 Notas Importantes

### ⚠️ Limitaciones Conocidas
- No es posible bloquear completamente el acceso a una URL (por diseño de la web)
- La protección se basa en redirecciones automáticas
- Usuarios sin JavaScript habilitado no estarán protegidos (pero tampoco podrán usar la app)

### 🔧 Mantenimiento
- Si agregas nuevas rutas de autenticación, aplica el middleware `rejectAuthenticated`
- Si cambias la lógica de autenticación, actualiza ambas capas de protección
- Mantén sincronizados los códigos de error entre frontend y backend

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras
1. **Rate Limiting más agresivo** en rutas de autenticación
2. **Logging de intentos** de acceso por usuarios autenticados
3. **Métricas** para detectar comportamientos anómalos
4. **Blacklist de tokens** para logout forzado

---

**Fecha de implementación:** 2026-01-10  
**Versión:** 1.0  
**Autor:** Sistema de protección de rutas
