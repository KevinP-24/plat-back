import jwt from 'jsonwebtoken'; 

class JWTUtils {
  constructor() {
    // JWT Secret - debe estar en variables de entorno
    this.secret = process.env.JWT_SECRET || 'plat-epa-secret-key-2025';
    
    // Configuraciones JWT
    this.options = {
    // Token expira en 1 hora (CAMBIADO)
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    // Algoritmo de cifrado
        algorithm: 'HS256',
    // Emisor
        issuer: 'PLAT-EPA-System'
    };
  }

  /**
   * Genera un token JWT
   * @param {Object} payload - Datos del usuario
   * @param {number} payload.id - ID del usuario
   * @param {string} payload.email - Email del usuario
   * @param {number} payload.rol_id - ID del rol
   * @param {string} payload.rol_nombre - Nombre del rol
   * @param {string} payload.nombre_usuario - Nombre de usuario
   * @returns {string} Token JWT
   */
  generateToken(payload) {
    try {
      // Validar payload requerido
      if (!payload.id || !payload.email || !payload.rol_id || !payload.rol_nombre) {
        throw new Error('Payload incompleto: se requiere id, email, rol_id y rol_nombre');
      }

      // Crear payload del token
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        rol_id: payload.rol_id,
        rol_nombre: payload.rol_nombre,
        nombre_usuario: payload.nombre_usuario,
        // Timestamp de creación
        iat: Math.floor(Date.now() / 1000)
      };

      // Generar token
      const token = jwt.sign(tokenPayload, this.secret, this.options);
      
      return token;
    } catch (error) {
      throw new Error(`Error generando token: ${error.message}`);
    }
  }

  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token a verificar
   * @returns {Object} Datos decodificados del token
   */
  verifyToken(token) {
    try {
      if (!token) {
        throw new Error('Token no proporcionado');
      }

      // Remover 'Bearer ' si está presente
      const cleanToken = token.startsWith('Bearer ') 
        ? token.slice(7) 
        : token;

      // Verificar y decodificar
      const decoded = jwt.verify(cleanToken, this.secret);
      
      return decoded;
    } catch (error) {
      // Manejar diferentes tipos de errores JWT
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token no válido aún');
      } else {
        throw new Error(`Error verificando token: ${error.message}`);
      }
    }
  }

  /**
   * Extrae el token del header Authorization
   * @param {Object} req - Request object de Express
   * @returns {string|null} Token extraído o null
   */
  extractTokenFromHeader(req) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return null;
      }

      // Verificar formato Bearer
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
      }

      // Si no tiene Bearer, asumir que es solo el token
      return authHeader;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica si un token está próximo a expirar
   * @param {Object} decodedToken - Token decodificado
   * @param {number} minutesThreshold - Minutos antes de la expiración (default: 30)
   * @returns {boolean} True si está próximo a expirar
   */
  isTokenNearExpiry(decodedToken, minutesThreshold = 30) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const threshold = minutesThreshold * 60; // Convertir a segundos
      
      return (decodedToken.exp - now) <= threshold;
    } catch (error) {
      return true; // En caso de error, asumir que está por expirar
    }
  }

  /**
   * Genera un token de refresh (más duradero)
   * @param {Object} payload - Datos básicos del usuario
   * @returns {string} Refresh token
   */
  generateRefreshToken(payload) {
    try {
      const refreshPayload = {
        id: payload.id,
        email: payload.email,
        type: 'refresh'
      };

      const refreshOptions = {
        ...this.options,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' // 7 días
      };

      return jwt.sign(refreshPayload, this.secret, refreshOptions);
    } catch (error) {
      throw new Error(`Error generando refresh token: ${error.message}`);
    }
  }

  /**
   * Valida si el usuario tiene el rol requerido
   * @param {Object} decodedToken - Token decodificado
   * @param {string|Array} requiredRoles - Rol(es) requerido(s)
   * @returns {boolean} True si tiene el rol
   */
  hasRole(decodedToken, requiredRoles) {
    try {
      if (!decodedToken || !decodedToken.rol_nombre) {
        return false;
      }

      const userRole = decodedToken.rol_nombre.toLowerCase();
      
      // Si requiredRoles es un string, convertir a array
      const roles = Array.isArray(requiredRoles) 
        ? requiredRoles.map(role => role.toLowerCase())
        : [requiredRoles.toLowerCase()];

      return roles.includes(userRole);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información básica del token para logs
   * @param {Object} decodedToken - Token decodificado
   * @returns {Object} Información para logs
   */
  getTokenInfo(decodedToken) {
    try {
      return {
        user_id: decodedToken.id,
        email: decodedToken.email,
        role: decodedToken.rol_nombre,
        username: decodedToken.nombre_usuario,
        issued_at: new Date(decodedToken.iat * 1000),
        expires_at: new Date(decodedToken.exp * 1000)
      };
    } catch (error) {
      return null;
    }
  }
}

// Exportar instancia única (Singleton)
export default new JWTUtils();