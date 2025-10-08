import jwtUtils from '../utils/jwt.js';

/**
 * Constantes de roles del sistema
 * Basado en la documentación del proyecto PLAT-EPA
 */
const ROLES = {
  ADMINISTRADOR: 'administrador',
  TECNICO: 'tecnico',
  USUARIO_FINAL: 'usuario final'
};

/**
 * Middleware para verificar roles específicos
 * @param {string|Array} allowedRoles - Rol(es) permitido(s)
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'USER_NOT_AUTHENTICATED'
        });
      }

      const hasRequiredRole = jwtUtils.hasRole(req.user, allowedRoles);

      if (!hasRequiredRole) {
        console.warn('Intento de acceso no autorizado:', {
          user_id: req.user.id,
          email: req.user.email,
          user_role: req.user.rol_nombre,
          required_roles: Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles],
          endpoint: `${req.method} ${req.path}`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
          error: 'INSUFFICIENT_PERMISSIONS',
          required_role: Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles],
          user_role: req.user.rol_nombre
        });
      }

      console.log('Acceso autorizado por rol:', {
        user_id: req.user.id,
        email: req.user.email,
        role: req.user.rol_nombre,
        endpoint: `${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
      });

      next();

    } catch (error) {
      console.error('Error en verificación de roles:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno en verificación de permisos',
        error: 'ROLE_VERIFICATION_ERROR'
      });
    }
  };
};

/** Middlewares específicos **/
const requireAdmin = requireRole(ROLES.ADMINISTRADOR);
const requireTechnicianOrAdmin = requireRole([ROLES.TECNICO, ROLES.ADMINISTRADOR]);
const requireAnyRole = requireRole([ROLES.ADMINISTRADOR, ROLES.TECNICO, ROLES.USUARIO_FINAL]);

/**
 * Middleware para verificar que el usuario solo acceda a sus propios datos
 */
const requireOwnershipOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'USER_NOT_AUTHENTICATED'
        });
      }

      if (jwtUtils.hasRole(req.user, ROLES.ADMINISTRADOR)) {
        return next();
      }

      const requestedUserId = parseInt(req.params[paramName]);
      const currentUserId = parseInt(req.user.id);

      if (requestedUserId !== currentUserId) {
        console.warn('Intento de acceso a datos ajenos:', {
          user_id: req.user.id,
          email: req.user.email,
          requested_user_id: requestedUserId,
          endpoint: `${req.method} ${req.path}`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propios datos',
          error: 'OWNERSHIP_REQUIRED'
        });
      }

      next();

    } catch (error) {
      console.error('Error en verificación de ownership:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno en verificación de permisos',
        error: 'OWNERSHIP_VERIFICATION_ERROR'
      });
    }
  };
};

/**
 * Middleware para verificar permisos por departamento
 */
const requireDepartmentAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'USER_NOT_AUTHENTICATED'
      });
    }

    if (jwtUtils.hasRole(req.user, ROLES.ADMINISTRADOR)) return next();
    if (jwtUtils.hasRole(req.user, ROLES.TECNICO)) return next();
    if (jwtUtils.hasRole(req.user, ROLES.USUARIO_FINAL)) return next();

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este departamento',
      error: 'DEPARTMENT_ACCESS_DENIED'
    });
  } catch (error) {
    console.error('Error en verificación de departamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en verificación de departamento',
      error: 'DEPARTMENT_VERIFICATION_ERROR'
    });
  }
};

/**
 * Helper para verificar si el usuario tiene un rol
 */
const userHasRole = (user, roles) => {
  if (!user || !user.rol_nombre) return false;
  return jwtUtils.hasRole(user, roles);
};

/**
 * Middleware para agregar permisos al request
 */
const addPermissions = (req, res, next) => {
  try {
    if (req.user) {
      req.permissions = {
        isAdmin: userHasRole(req.user, ROLES.ADMINISTRADOR),
        isTechnician: userHasRole(req.user, ROLES.TECNICO),
        isEndUser: userHasRole(req.user, ROLES.USUARIO_FINAL),
        canManageUsers: userHasRole(req.user, ROLES.ADMINISTRADOR),
        canManageTickets: userHasRole(req.user, [ROLES.ADMINISTRADOR, ROLES.TECNICO]),
        canManageInventory: userHasRole(req.user, [ROLES.ADMINISTRADOR, ROLES.TECNICO]),
        canViewReports: userHasRole(req.user, [ROLES.ADMINISTRADOR, ROLES.TECNICO])
      };
    } else {
      req.permissions = {
        isAdmin: false,
        isTechnician: false,
        isEndUser: false,
        canManageUsers: false,
        canManageTickets: false,
        canManageInventory: false,
        canViewReports: false
      };
    }

    next();
  } catch (error) {
    console.error('Error agregando permisos:', error);
    next();
  }
};

export {
  ROLES,
  requireRole,
  requireAdmin,
  requireTechnicianOrAdmin,
  requireAnyRole,
  requireOwnershipOrAdmin,
  requireDepartmentAccess,
  addPermissions,
  userHasRole
};