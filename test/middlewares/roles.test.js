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
  
  
  
  
  