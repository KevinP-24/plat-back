import { jest } from '@jest/globals';

// --- Mocks manuales ---
const hasRoleMock = jest.fn();

// --- Registrar el mock del módulo ---
jest.unstable_mockModule('../../utils/jwt.js', () => ({
  default: {
    hasRole: hasRoleMock
  },
  hasRole: hasRoleMock
}));

// --- Importar los módulos DESPUÉS de definir los mocks ---
const { 
  ROLES,
  requireRole,
  requireAdmin,
  requireTechnicianOrAdmin,
  requireAnyRole,
  requireOwnershipOrAdmin,
  requireDepartmentAccess,
  addPermissions,
  userHasRole
} = await import('../../middlewares/roles.js');



// ============================================================================
// TESTS PARA CONSTANTES
// ============================================================================

describe('Constantes ROLES', () => {
    it('debe tener los roles correctos definidos', () => {
      expect(ROLES).toEqual({
        ADMINISTRADOR: 'administrador',
        TECNICO: 'tecnico',
        USUARIO_FINAL: 'usuario final'
      });
    });
  });
  
  
// ============================================================================
// TESTS PARA requireRole
// ============================================================================

describe('Middleware requireRole', () => {
    let req, res, next, consoleWarnSpy, consoleLogSpy, consoleErrorSpy;
  
    beforeEach(() => {
      req = { 
        user: null,
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  
    it('debe retornar 401 si no hay usuario autenticado', () => {
      const middleware = requireRole(ROLES.ADMINISTRADOR);
      req.user = null;
  
      middleware(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'USER_NOT_AUTHENTICATED'
      }));
      expect(next).not.toHaveBeenCalled();
    });
  
    it('debe retornar 403 si el usuario no tiene el rol requerido', () => {
      const middleware = requireRole(ROLES.ADMINISTRADOR);
      req.user = {
        id: 1,
        email: 'test@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockReturnValue(false);
  
      middleware(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        required_role: ['administrador'],
        user_role: 'tecnico'
      }));
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  
    it('debe continuar si el usuario tiene el rol requerido', () => {
      const middleware = requireRole(ROLES.ADMINISTRADOR);
      req.user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      hasRoleMock.mockReturnValue(true);
  
      middleware(req, res, next);
  
      expect(next).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Acceso autorizado por rol:',
        expect.objectContaining({
          user_id: 1,
          email: 'admin@epa.gov.co',
          role: 'administrador'
        })
      );
    });
  
    it('debe manejar múltiples roles permitidos', () => {
      const middleware = requireRole([ROLES.ADMINISTRADOR, ROLES.TECNICO]);
      req.user = {
        id: 1,
        email: 'tech@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockReturnValue(true);
  
      middleware(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe retornar 500 si hay un error inesperado', () => {
      const middleware = requireRole(ROLES.ADMINISTRADOR);
      req.user = {
        id: 1,
        email: 'test@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockImplementation(() => {
        throw new Error('Error inesperado');
      });
  
      middleware(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'ROLE_VERIFICATION_ERROR'
      }));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
  
  
// ============================================================================
// TESTS PARA requireAdmin
// ============================================================================

describe('Middleware requireAdmin', () => {
    let req, res, next;
  
    beforeEach(() => {
      req = { 
        user: null,
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      jest.clearAllMocks();
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
  
    afterEach(() => {
      console.warn.mockRestore();
      console.log.mockRestore();
    });
  
    it('debe permitir acceso solo a administradores', () => {
      req.user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      hasRoleMock.mockReturnValue(true);
  
      requireAdmin(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe denegar acceso a técnicos', () => {
      req.user = {
        id: 2,
        email: 'tech@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockReturnValue(false);
  
      requireAdmin(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  
// ============================================================================
// TESTS PARA requireTechnicianOrAdmin
// ============================================================================

describe('Middleware requireTechnicianOrAdmin', () => {
    let req, res, next;
  
    beforeEach(() => {
      req = { 
        user: null,
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      jest.clearAllMocks();
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
  
    afterEach(() => {
      console.warn.mockRestore();
      console.log.mockRestore();
    });
  
    it('debe permitir acceso a administradores', () => {
      req.user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      hasRoleMock.mockReturnValue(true);
  
      requireTechnicianOrAdmin(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe permitir acceso a técnicos', () => {
      req.user = {
        id: 2,
        email: 'tech@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockReturnValue(true);
  
      requireTechnicianOrAdmin(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe denegar acceso a usuarios finales', () => {
      req.user = {
        id: 3,
        email: 'user@epa.gov.co',
        rol_nombre: 'usuario final'
      };
      hasRoleMock.mockReturnValue(false);
  
      requireTechnicianOrAdmin(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  
// ============================================================================
// TESTS PARA requireAnyRole
// ============================================================================

describe('Middleware requireAnyRole', () => {
    let req, res, next;
  
    beforeEach(() => {
      req = { 
        user: null,
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      jest.clearAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
  
    afterEach(() => {
      console.log.mockRestore();
    });
  
    it('debe permitir acceso a cualquier rol autenticado', () => {
      req.user = {
        id: 3,
        email: 'user@epa.gov.co',
        rol_nombre: 'usuario final'
      };
      hasRoleMock.mockReturnValue(true);
  
      requireAnyRole(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  });
  
  
  
// ============================================================================
// TESTS PARA requireOwnershipOrAdmin
// ============================================================================

describe('Middleware requireOwnershipOrAdmin', () => {
    let req, res, next, consoleWarnSpy, consoleErrorSpy;
  
    beforeEach(() => {
      req = { 
        user: null,
        params: {},
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  
    it('debe retornar 401 si no hay usuario autenticado', () => {
      const middleware = requireOwnershipOrAdmin();
      req.user = null;
      req.params.id = '1';
  
      middleware(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'USER_NOT_AUTHENTICATED'
      }));
    });
  
    it('debe permitir acceso a administradores sin verificar ownership', () => {
      const middleware = requireOwnershipOrAdmin();
      req.user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      req.params.id = '999';
      hasRoleMock.mockReturnValue(true);
  
      middleware(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe permitir acceso si el usuario es el propietario', () => {
      const middleware = requireOwnershipOrAdmin();
      req.user = {
        id: 5,
        email: 'user@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      req.params.id = '5';
      hasRoleMock.mockReturnValue(false);
  
      middleware(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe denegar acceso si el usuario intenta acceder a datos ajenos', () => {
      const middleware = requireOwnershipOrAdmin();
      req.user = {
        id: 5,
        email: 'user@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      req.params.id = '10';
      hasRoleMock.mockReturnValue(false);
  
      middleware(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'OWNERSHIP_REQUIRED'
      }));
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  
    it('debe usar nombre de parámetro personalizado', () => {
      const middleware = requireOwnershipOrAdmin('userId');
      req.user = {
        id: 5,
        email: 'user@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      req.params.userId = '5';
      hasRoleMock.mockReturnValue(false);
  
      middleware(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe retornar 500 si hay un error inesperado', () => {
      const middleware = requireOwnershipOrAdmin();
      req.user = {
        id: 5,
        email: 'user@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      req.params.id = 'invalid';
      hasRoleMock.mockImplementation(() => {
        throw new Error('Error inesperado');
      });
  
      middleware(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'OWNERSHIP_VERIFICATION_ERROR'
      }));
    });
  });
  
  
// ============================================================================
// TESTS PARA requireDepartmentAccess
// ============================================================================

describe('Middleware requireDepartmentAccess', () => {
    let req, res, next, consoleErrorSpy;
  
    beforeEach(() => {
      req = { 
        user: null,
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
  
    it('debe retornar 401 si no hay usuario autenticado', () => {
      req.user = null;
  
      requireDepartmentAccess(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'USER_NOT_AUTHENTICATED'
      }));
    });
  
    it('debe permitir acceso a administradores', () => {
      req.user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      hasRoleMock.mockReturnValueOnce(true);
  
      requireDepartmentAccess(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe permitir acceso a técnicos', () => {
      req.user = {
        id: 2,
        email: 'tech@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
  
      requireDepartmentAccess(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe permitir acceso a usuarios finales', () => {
      req.user = {
        id: 3,
        email: 'user@epa.gov.co',
        rol_nombre: 'usuario final'
      };
      hasRoleMock
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
  
      requireDepartmentAccess(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  
    it('debe retornar 403 si el usuario no tiene ningún rol válido', () => {
      req.user = {
        id: 4,
        email: 'invalid@epa.gov.co',
        rol_nombre: 'rol_invalido'
      };
      hasRoleMock.mockReturnValue(false);
  
      requireDepartmentAccess(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'DEPARTMENT_ACCESS_DENIED'
      }));
    });
  
    it('debe retornar 500 si hay un error inesperado', () => {
      req.user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      hasRoleMock.mockImplementation(() => {
        throw new Error('Error inesperado');
      });
  
      requireDepartmentAccess(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'DEPARTMENT_VERIFICATION_ERROR'
      }));
    });
  });
  
  
// ============================================================================
// TESTS PARA userHasRole
// ============================================================================

describe('Helper userHasRole', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('debe retornar false si no hay usuario', () => {
      hasRoleMock.mockReturnValue(false);
  
      const result = userHasRole(null, ROLES.ADMINISTRADOR);
  
      expect(result).toBe(false);
    });
  
    it('debe retornar false si el usuario no tiene rol_nombre', () => {
      const user = { id: 1, email: 'test@epa.gov.co' };
      hasRoleMock.mockReturnValue(false);
  
      const result = userHasRole(user, ROLES.ADMINISTRADOR);
  
      expect(result).toBe(false);
    });
  
    it('debe retornar true si el usuario tiene el rol', () => {
      const user = {
        id: 1,
        email: 'admin@epa.gov.co',
        rol_nombre: 'administrador'
      };
      hasRoleMock.mockReturnValue(true);
  
      const result = userHasRole(user, ROLES.ADMINISTRADOR);
  
      expect(result).toBe(true);
    });
  
    it('debe funcionar con múltiples roles', () => {
      const user = {
        id: 2,
        email: 'tech@epa.gov.co',
        rol_nombre: 'tecnico'
      };
      hasRoleMock.mockReturnValue(true);
  
      const result = userHasRole(user, [ROLES.ADMINISTRADOR, ROLES.TECNICO]);
  
      expect(result).toBe(true);
    });
  });
  
  
  
  
  
  
  
  