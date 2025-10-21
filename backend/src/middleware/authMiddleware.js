import jwt from 'jsonwebtoken';
import { User } from '../models/models.js';

export const protect = async (req, res, next) => {
  let token;

  // El token ahora viene en el encabezado 'Authorization' con el formato 'Bearer <token>'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Obtener el token del encabezado
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Obtener el usuario desde la BD y adjuntarlo a la petición (sin la contraseña)
      req.user = await User.findById(decoded.userId).select('-password');

      next(); // Continuar a la siguiente función (la ruta de la API)
    } catch (error) {
      // Si jwt.verify falla, es porque el token expiró o es inválido.
      return res.status(401).json({ code: 'ACCESS_TOKEN_EXPIRED', message: 'El token de acceso ha expirado.' });
    }
  }

  if (!token) {
    return res.status(401).json({ code: 'TOKEN_MISSING', message: 'No autorizado, no se proporcionó token.' });
  }
};