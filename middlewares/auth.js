import jwtUtils from '../utils/jwt.js';

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario esté autenticado con un token válido
 */
const verifyToken = async (req, res, next) => {
  try {
    // 1. Extraer token del header
    const token = jwtUtils.extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        error: 'MISSING_TOKEN'
      });
    }

    // 2. Verificar y decodificar token
    const decoded = jwtUtils.verifyToken(token);
    
    // 3. Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol_id: decoded.rol_id,
      rol_nombre: decoded.rol_nombre,
      token_info: jwtUtils.getTokenInfo(decoded)
    };

    // 4. Verificar si el token está próximo a expirar (opcional)
    if (jwtUtils.isTokenNearExpiry(decoded)) {
      // Agregar header informativo para el frontend
      res.set('X-Token-Warning', 'Token próximo a expirar');
    }

    // 5. Continuar con el siguiente middleware
    next();

  } catch (error) {
    // Log del error para auditoría
    console.error('Error en autenticación:', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: `${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    });

    // Respuesta de error según el tipo
    let statusCode = 401;
    let errorCode = 'TOKEN_ERROR';
    let message = 'Token inválido';

    if (error.message.includes('expirado')) {
      statusCode = 401;
      errorCode = 'TOKEN_EXPIRED';
      message = 'Token expirado. Por favor, inicia sesión nuevamente';
    } else if (error.message.includes('inválido')) {
      statusCode = 401;
      errorCode = 'TOKEN_INVALID';
      message = 'Token inválido';
    } else if (error.message.includes('no válido aún')) {
      statusCode = 401;
      errorCode = 'TOKEN_NOT_ACTIVE';
      message = 'Token no válido aún';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: errorCode
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Permite endpoints que pueden funcionar con o sin autenticación
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Intentar extraer token
    const token = jwtUtils.extractTokenFromHeader(req);
    
    if (token) {
      try {
        // Si hay token, intentar verificarlo
        const decoded = jwtUtils.verifyToken(token);
        
        req.user = {
          id: decoded.id,
          email: decoded.email,
          rol_id: decoded.rol_id,
          rol_nombre: decoded.rol_nombre,
          token_info: jwtUtils.getTokenInfo(decoded)
        };
        
        req.authenticated = true;
      } catch (error) {
        // Si el token es inválido, continuar sin autenticar
        req.authenticated = false;
        req.user = null;
      }
    } else {
      // Sin token, continuar como usuario no autenticado
      req.authenticated = false;
      req.user = null;
    }

    next();

  } catch (error) {
    // En caso de error, continuar sin autenticar
    req.authenticated = false;
    req.user = null;
    next();
  }
};

/**
 * Middleware para verificar que el usuario esté activo
 * Se puede combinar con verifyToken para validaciones adicionales
 */
const verifyActiveUser = async (req, res, next) => {
  try {
    // Este middleware asume que ya se ejecutó verifyToken
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'USER_NOT_AUTHENTICATED'
      });
    }

    // Aquí podrías hacer una consulta adicional a la BD para verificar
    // si el usuario sigue activo, pero por ahora asumimos que sí
    // ya que el token es válido

    next();

  } catch (error) {
    console.error('Error verificando usuario activo:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error verificando estado del usuario',
      error: 'USER_VERIFICATION_ERROR'
    });
  }
};

/**
 * Middleware para logging de acceso
 * Registra los accesos autenticados para auditoría
 */
const logAccess = (req, res, next) => {
  // Solo hacer log si está autenticado
  if (req.user) {
    console.log('Acceso autenticado:', {
      user_id: req.user.id,
      email: req.user.email,
      role: req.user.rol_nombre,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Middleware para validar que el token no esté en lista negra
 * (Para implementar logout real en el futuro)
 */
const checkTokenBlacklist = async (req, res, next) => {
  try {
    // Por ahora, este middleware no hace nada
    // En el futuro podrías implementar una blacklist en Redis o BD
    // para tokens que fueron "logged out"
    
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token revocado',
      error: 'TOKEN_BLACKLISTED'
    });
  }
};

export {
  verifyToken,
  optionalAuth,
  verifyActiveUser,
  logAccess,
  checkTokenBlacklist
};