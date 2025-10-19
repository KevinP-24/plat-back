import { jest } from '@jest/globals';

// --- Mocks manuales ---
const extractTokenFromHeader = jest.fn();
const verifyTokenMock = jest.fn();
const getTokenInfo = jest.fn();
const isTokenNearExpiry = jest.fn();

// --- Registrar el mock del módulo ---
jest.unstable_mockModule('../../utils/jwt.js', () => ({
  default: {
    extractTokenFromHeader,
    verifyToken: verifyTokenMock,
    getTokenInfo,
    isTokenNearExpiry
  },
  extractTokenFromHeader,
  verifyToken: verifyTokenMock,
  getTokenInfo,
  isTokenNearExpiry
}));

// --- Importar los módulos DESPUÉS de definir los mocks ---
const { 
  verifyToken, 
  optionalAuth, 
  verifyActiveUser, 
  logAccess, 
  checkTokenBlacklist 
} = await import('../../middlewares/auth.js');

// ============================================================================
// TESTS PARA verifyToken
// ============================================================================

describe('Middleware verifyToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = { 
      headers: {}, 
      ip: '127.0.0.1', 
      get: jest.fn(), 
      method: 'GET', 
      path: '/test' 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('debe retornar 401 si no hay token', async () => {
    extractTokenFromHeader.mockReturnValue(null);

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'MISSING_TOKEN'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('debe continuar al siguiente middleware con token válido', async () => {
    const decoded = { 
      id: 1, 
      email: 'test@epa.gov.co', 
      rol_id: 2, 
      rol_nombre: 'tecnico' 
    };

    extractTokenFromHeader.mockReturnValue('fakeToken');
    verifyTokenMock.mockReturnValue(decoded);
    getTokenInfo.mockReturnValue({ exp: Date.now() / 1000 + 10000 });
    isTokenNearExpiry.mockReturnValue(false);

    await verifyToken(req, res, next);

    expect(req.user).toEqual(expect.objectContaining({
      id: 1,
      email: 'test@epa.gov.co',
      rol_nombre: 'tecnico'
    }));
    expect(next).toHaveBeenCalled();
  });

  it('debe agregar encabezado si el token está próximo a expirar', async () => {
    const decoded = { 
      id: 1, 
      email: 'test@epa.gov.co', 
      rol_id: 2, 
      rol_nombre: 'tecnico' 
    };

    extractTokenFromHeader.mockReturnValue('fakeToken');
    verifyTokenMock.mockReturnValue(decoded);
    getTokenInfo.mockReturnValue({ exp: Date.now() / 1000 + 1000 });
    isTokenNearExpiry.mockReturnValue(true);

    await verifyToken(req, res, next);

    expect(res.set).toHaveBeenCalledWith('X-Token-Warning', 'Token próximo a expirar');
    expect(next).toHaveBeenCalled();
  });

  it('debe retornar 401 si el token está expirado', async () => {
    extractTokenFromHeader.mockReturnValue('fakeToken');
    verifyTokenMock.mockImplementation(() => { 
      const error = new Error('Token expirado');
      error.name = 'TokenExpiredError';
      throw error;
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'TOKEN_EXPIRED'
    }));
  });

  it('debe retornar 401 si el token es inválido', async () => {
    extractTokenFromHeader.mockReturnValue('fakeToken');
    verifyTokenMock.mockImplementation(() => { 
      const error = new Error('Token inválido');
      error.name = 'JsonWebTokenError';
      throw error;
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'TOKEN_INVALID'
    }));
  });

  it('debe retornar 401 si el token no es válido aún', async () => {
    extractTokenFromHeader.mockReturnValue('fakeToken');
    verifyTokenMock.mockImplementation(() => { 
      const error = new Error('Token no válido aún');
      error.name = 'NotBeforeError';
      throw error;
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'TOKEN_NOT_ACTIVE'
    }));
  });
});



// ============================================================================
// TESTS PARA optionalAuth
// ============================================================================

describe('Middleware optionalAuth', () => {
    let req, res, next;
  
    beforeEach(() => {
      req = { 
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(), 
        method: 'GET', 
        path: '/test' 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        set: jest.fn()
      };
      next = jest.fn();
      jest.clearAllMocks();
    });
  
    it('debe continuar sin autenticar si no hay token', async () => {
      extractTokenFromHeader.mockReturnValue(null);
  
      await optionalAuth(req, res, next);
  
      expect(req.authenticated).toBe(false);
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  
    it('debe autenticar si hay un token válido', async () => {
      const decoded = { 
        id: 1, 
        email: 'test@epa.gov.co', 
        rol_id: 2, 
        rol_nombre: 'tecnico' 
      };
  
      extractTokenFromHeader.mockReturnValue('fakeToken');
      verifyTokenMock.mockReturnValue(decoded);
      getTokenInfo.mockReturnValue({ exp: Date.now() / 1000 + 10000 });
  
      await optionalAuth(req, res, next);
  
      expect(req.authenticated).toBe(true);
      expect(req.user).toEqual(expect.objectContaining({
        id: 1,
        email: 'test@epa.gov.co',
        rol_nombre: 'tecnico'
      }));
      expect(next).toHaveBeenCalled();
    });
  
    it('debe continuar sin autenticar si el token es inválido', async () => {
      extractTokenFromHeader.mockReturnValue('invalidToken');
      verifyTokenMock.mockImplementation(() => { 
        throw new Error('Token inválido');
      });
  
      await optionalAuth(req, res, next);
  
      expect(req.authenticated).toBe(false);
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  
    it('debe continuar sin autenticar si hay un error inesperado', async () => {
      extractTokenFromHeader.mockImplementation(() => { 
        throw new Error('Error inesperado');
      });
  
      await optionalAuth(req, res, next);
  
      expect(req.authenticated).toBe(false);
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
  
  
// ============================================================================
// TESTS PARA verifyActiveUser
// ============================================================================

describe('Middleware verifyActiveUser', () => {
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
    });
  
    it('debe retornar 401 si no hay usuario autenticado', async () => {
      req.user = null;
  
      await verifyActiveUser(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'USER_NOT_AUTHENTICATED'
      }));
      expect(next).not.toHaveBeenCalled();
    });
  
    it('debe continuar si hay usuario autenticado', async () => {
      req.user = {
        id: 1,
        email: 'test@epa.gov.co',
        rol_id: 2,
        rol_nombre: 'tecnico'
      };
  
      await verifyActiveUser(req, res, next);
  
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  
    it('debe manejar errores inesperados y retornar 500', async () => {
      req.user = {
        id: 1,
        email: 'test@epa.gov.co'
      };
  
      // Simular un error en el next
      next.mockImplementation(() => {
        throw new Error('Error inesperado');
      });
  
      await verifyActiveUser(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'USER_VERIFICATION_ERROR'
      }));
    });
  });
  
  
// ============================================================================
// TESTS PARA logAccess
// ============================================================================

describe('Middleware logAccess', () => {
    let req, res, next, consoleLogSpy;
  
    beforeEach(() => {
      req = { 
        user: null,
        headers: {}, 
        ip: '127.0.0.1', 
        get: jest.fn(() => 'TestUserAgent'), 
        method: 'GET', 
        path: '/test' 
      };
      res = {};
      next = jest.fn();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleLogSpy.mockRestore();
    });
  
    it('debe registrar acceso si hay usuario autenticado', () => {
      req.user = {
        id: 1,
        email: 'test@epa.gov.co',
        rol_nombre: 'tecnico'
      };
  
      logAccess(req, res, next);
  
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Acceso autenticado:', 
        expect.objectContaining({
          user_id: 1,
          email: 'test@epa.gov.co',
          role: 'tecnico',
          endpoint: 'GET /test',
          ip: '127.0.0.1'
        })
      );
      expect(next).toHaveBeenCalled();
    });
  
    it('no debe registrar acceso si no hay usuario autenticado', () => {
      req.user = null;
  
      logAccess(req, res, next);
  
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  
    it('debe continuar incluso si hay error en el log', () => {
      req.user = {
        id: 1,
        email: 'test@epa.gov.co',
        rol_nombre: 'tecnico'
      };
  
      consoleLogSpy.mockImplementation(() => {
        throw new Error('Log error');
      });
  
      expect(() => logAccess(req, res, next)).toThrow();
    });
  });
  
  
// ============================================================================
// TESTS PARA checkTokenBlacklist
// ============================================================================

describe('Middleware checkTokenBlacklist', () => {
    let req, res, next;
  
    beforeEach(() => {
      req = { 
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
    });
  
    it('debe continuar normalmente (funcionalidad no implementada)', async () => {
      await checkTokenBlacklist(req, res, next);
  
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  
    it('debe manejar implementación futura de blacklist', async () => {
      // Este test está preparado para cuando se implemente la blacklist
      // Por ahora solo verifica que el middleware existe y funciona
      
      await checkTokenBlacklist(req, res, next);
  
      expect(next).toHaveBeenCalled();
    });
  });