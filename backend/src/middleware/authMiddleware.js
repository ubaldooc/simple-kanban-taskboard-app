import jwt from 'jsonwebtoken';
import { User } from '../models/models.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    try {
      // 1. Obtener el token de la cookie
      token = req.cookies.token;

      // 2. Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Obtener el usuario desde la BD y adjuntarlo a la petición (sin la contraseña)
      req.user = await User.findById(decoded.userId).select('-password');

      next(); // Continuar a la siguiente función (la ruta de la API)
    } catch (error) {
      return res.status(401).json({ message: 'No autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token.' });
  }
};