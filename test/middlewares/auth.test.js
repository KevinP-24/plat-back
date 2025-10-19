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
  
  