import jwt from 'jsonwebtoken';

/**
 * Middleware para rechazar el acceso a usuarios que YA están autenticados.
 * Útil para rutas como /auth/login o /auth/register donde solo usuarios
 * NO autenticados deberían poder acceder.
 * 
 * Si el usuario está autenticado (tiene un accessToken válido), 
 * devuelve un error 403 (Forbidden).
 */
export const rejectAuthenticated = async (req, res, next) => {
    let token;

    // Verificar si hay un token en el encabezado Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Intentar verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Si llegamos aquí, el token es válido y el usuario está autenticado
            // Por lo tanto, NO debería acceder a esta ruta (login/register)
            return res.status(403).json({
                code: 'ALREADY_AUTHENTICATED',
                message: 'Ya has iniciado sesión. No puedes acceder a esta página.'
            });
        } catch (error) {
            // Si el token es inválido o expiró, está bien - el usuario puede continuar
            // (es como si no estuviera autenticado)
            return next();
        }
    }

    // Si no hay token, el usuario no está autenticado - puede continuar
    next();
};
