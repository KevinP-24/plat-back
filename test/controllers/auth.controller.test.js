import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

// --- Mocks manuales ---
const mockSql = jest.fn();
const generateTokenMock = jest.fn();
const generateRefreshTokenMock = jest.fn();

// --- Registrar mocks de módulos ---
jest.unstable_mockModule('../../config/db.js', () => ({
  default: mockSql
}));

jest.unstable_mockModule('../../utils/jwt.js', () => ({
  default: {
    generateToken: generateTokenMock,
    generateRefreshToken: generateRefreshTokenMock
  }
}));

// --- Importar el controlador DESPUÉS de los mocks ---
const { default: authController } = await import('../../controllers/auth.controller.js');


// ============================================================================
// TESTS PARA login
// ============================================================================

describe('AuthController - login', () => {
    let req, res, consoleWarnSpy, consoleLogSpy, consoleErrorSpy;
  
    beforeEach(() => {
      req = {
        body: {},
        ip: '127.0.0.1',
        get: jest.fn(() => 'TestUserAgent')
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
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
  
    // --- Tests de validación de entrada ---
  
    it('debe retornar 400 si no se proporciona email', async () => {
      req.body = { password: '123456' };
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'MISSING_CREDENTIALS'
      }));
    });
  
    it('debe retornar 400 si no se proporciona password', async () => {
      req.body = { email: 'test@epa.gov.co' };
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'MISSING_CREDENTIALS'
      }));
    });
  
    it('debe retornar 400 si el formato del email es inválido', async () => {
      req.body = { email: 'invalid-email', password: '123456' };
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INVALID_EMAIL_FORMAT'
      }));
    });
  
    it('debe retornar 400 si la contraseña está vacía', async () => {
      req.body = { email: 'test@epa.gov.co', password: '   ' };
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'MISSING_PASSWORD'
      }));
    });
  
    // --- Tests de autenticación ---
  
    it('debe retornar 401 si el usuario no existe', async () => {
      req.body = { email: 'noexiste@epa.gov.co', password: '123456' };
      mockSql.mockResolvedValue([]);
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INVALID_CREDENTIALS'
      }));
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  
    it('debe retornar 401 si la cuenta no está activada', async () => {
      req.body = { email: 'inactivo@epa.gov.co', password: '123456' };
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'inactivo@epa.gov.co',
        password: await bcrypt.hash('123456', 10),
        activo: false,
        rol_activo: true,
        nombres: 'Usuario',
        apellidos: 'Inactivo',
        rol_id: 2,
        rol_nombre: 'tecnico'
      }]);
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'ACCOUNT_NOT_ACTIVATED'
      }));
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  
    it('debe retornar 401 si el rol está inactivo', async () => {
      req.body = { email: 'test@epa.gov.co', password: '123456' };
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'test@epa.gov.co',
        password: await bcrypt.hash('123456', 10),
        activo: true,
        rol_activo: false,
        nombres: 'Test',
        apellidos: 'User',
        rol_id: 2,
        rol_nombre: 'tecnico'
      }]);
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'ROLE_INACTIVE'
      }));
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  
    it('debe retornar 401 si la contraseña es incorrecta', async () => {
      req.body = { email: 'test@epa.gov.co', password: 'wrongpassword' };
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'test@epa.gov.co',
        password: await bcrypt.hash('correctpassword', 10),
        activo: true,
        rol_activo: true,
        nombres: 'Test',
        apellidos: 'User',
        rol_id: 2,
        rol_nombre: 'tecnico'
      }]);
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INVALID_CREDENTIALS'
      }));
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  
    // --- Test de login exitoso ---
  
    it('debe retornar 200 y tokens cuando las credenciales son válidas', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      req.body = { email: 'admin@epa.gov.co', password: '123456' };
      
      // Primera llamada: buscar usuario
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'admin@epa.gov.co',
        password: hashedPassword,
        activo: true,
        rol_activo: true,
        nombres: 'Admin',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Administrador',
        rol_id: 1,
        rol_nombre: 'administrador',
        ultimo_acceso: new Date(),
        fecha_creacion: new Date()
      }]);
  
      // Segunda llamada: actualizar último acceso
      mockSql.mockResolvedValueOnce([]);
  
      generateTokenMock.mockReturnValue('fake-access-token');
      generateRefreshTokenMock.mockReturnValue('fake-refresh-token');
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Bienvenido'),
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            email: 'admin@epa.gov.co'
          }),
          tokens: expect.objectContaining({
            access_token: 'fake-access-token',
            refresh_token: 'fake-refresh-token'
          }),
          permisos: expect.objectContaining({
            es_admin: true
          })
        })
      }));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Login exitoso'),
        expect.any(Object)
      );
    });
  
    it('debe normalizar el email (trim y lowercase) antes de buscar', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      req.body = { email: '  TEST@EPA.GOV.CO  ', password: '123456' };
      
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'test@epa.gov.co',
        password: hashedPassword,
        activo: true,
        rol_activo: true,
        nombres: 'Test',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Técnico',
        rol_id: 2,
        rol_nombre: 'tecnico',
        ultimo_acceso: new Date(),
        fecha_creacion: new Date()
      }]);
  
      mockSql.mockResolvedValueOnce([]);
  
      generateTokenMock.mockReturnValue('fake-access-token');
      generateRefreshTokenMock.mockReturnValue('fake-refresh-token');
  
      await authController.login(req, res);
  
      // Verificar que mockSql fue llamado
      expect(mockSql).toHaveBeenCalled();
      
      // Verificar la primera llamada (búsqueda de usuario) contiene el email normalizado
      const firstCall = mockSql.mock.calls[0];
      const emailParam = firstCall[firstCall.length - 1]; // El último parámetro es el email
      expect(emailParam).toBe('test@epa.gov.co');
      
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    // --- Test de manejo de errores ---
  
    it('debe retornar 500 si hay error al generar tokens', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      req.body = { email: 'test@epa.gov.co', password: '123456' };
      
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'test@epa.gov.co',
        password: hashedPassword,
        activo: true,
        rol_activo: true,
        nombres: 'Test',
        apellidos: 'User',
        rol_id: 2,
        rol_nombre: 'tecnico'
      }]);
  
      generateTokenMock.mockImplementation(() => {
        throw new Error('Error generando token');
      });
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'TOKEN_GENERATION_ERROR'
      }));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  
    it('debe retornar 500 si hay error en la base de datos', async () => {
      req.body = { email: 'test@epa.gov.co', password: '123456' };
      mockSql.mockRejectedValue(new Error('Database error'));
  
      await authController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INTERNAL_SERVER_ERROR'
      }));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  
    // --- Test de permisos ---
  
    it('debe retornar permisos correctos para administrador', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      req.body = { email: 'admin@epa.gov.co', password: '123456' };
      
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'admin@epa.gov.co',
        password: hashedPassword,
        activo: true,
        rol_activo: true,
        nombres: 'Admin',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Administrador',
        rol_id: 1,
        rol_nombre: 'administrador',
        ultimo_acceso: new Date(),
        fecha_creacion: new Date()
      }]);
  
      mockSql.mockResolvedValueOnce([]);
  
      generateTokenMock.mockReturnValue('fake-access-token');
      generateRefreshTokenMock.mockReturnValue('fake-refresh-token');
  
      await authController.login(req, res);
  
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          permisos: {
            es_admin: true,
            es_tecnico: false,
            es_usuario_final: false
          }
        })
      }));
    });
  
    it('debe retornar permisos correctos para técnico', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      req.body = { email: 'tech@epa.gov.co', password: '123456' };
      
      mockSql.mockResolvedValueOnce([{
        id: 2,
        email: 'tech@epa.gov.co',
        password: hashedPassword,
        activo: true,
        rol_activo: true,
        nombres: 'Tech',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Técnico',
        rol_id: 2,
        rol_nombre: 'tecnico',
        ultimo_acceso: new Date(),
        fecha_creacion: new Date()
      }]);
  
      mockSql.mockResolvedValueOnce([]);
  
      generateTokenMock.mockReturnValue('fake-access-token');
      generateRefreshTokenMock.mockReturnValue('fake-refresh-token');
  
      await authController.login(req, res);
  
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          permisos: {
            es_admin: false,
            es_tecnico: true,
            es_usuario_final: false
          }
        })
      }));
    });
  });
  
  
  
// ============================================================================
// TESTS PARA logout
// ============================================================================

describe('AuthController - logout', () => {
    let req, res, consoleLogSpy, consoleErrorSpy;
  
    beforeEach(() => {
      req = {
        user: {
          id: 1,
          email: 'test@epa.gov.co',
          rol_nombre: 'tecnico'
        },
        ip: '127.0.0.1',
        get: jest.fn(() => 'TestUserAgent')
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  
    it('debe cerrar sesión exitosamente', async () => {
      await authController.logout(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Sesión cerrada exitosamente',
        data: expect.objectContaining({
          logout_time: expect.any(String)
        })
      }));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Logout exitoso'),
        expect.any(Object)
      );
    });
  
    it('debe registrar información del usuario en el log', async () => {
      await authController.logout(req, res);
  
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Logout exitoso'),
        expect.objectContaining({
          user_id: 1,
          email: 'test@epa.gov.co',
          ip: '127.0.0.1'
        })
      );
    });
  
    it('debe retornar 500 si hay un error inesperado', async () => {
      // Forzar un error
      req.user = null;
      
      await authController.logout(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INTERNAL_SERVER_ERROR'
      }));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
  
  

// ============================================================================
// TESTS PARA verificarSesion
// ============================================================================

describe('AuthController - verificarSesion', () => {
    let req, res, consoleErrorSpy;
  
    beforeEach(() => {
      req = {
        user: {
          id: 1,
          email: 'test@epa.gov.co',
          rol_id: 2,
          rol_nombre: 'tecnico',
          token_info: {
            exp: Date.now() / 1000 + 3600,
            iat: Date.now() / 1000
          }
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
  
    it('debe retornar información del usuario si la sesión es válida', async () => {
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'test@epa.gov.co',
        nombres: 'Test',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Técnico',
        rol_id: 2,
        rol_nombre: 'tecnico',
        activo: true,
        rol_activo: true,
        ultimo_acceso: new Date()
      }]);
  
      await authController.verificarSesion(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            email: 'test@epa.gov.co',
            nombres: 'Test',
            apellidos: 'User'
          }),
          permisos: expect.any(Object)
        })
      }));
    });
  
    it('debe retornar 401 si el usuario no existe', async () => {
      mockSql.mockResolvedValue([]);
  
      await authController.verificarSesion(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INVALID_SESSION'
      }));
    });
  
    it('debe retornar 401 si el usuario está inactivo', async () => {
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'test@epa.gov.co',
        nombres: 'Test',
        apellidos: 'User',
        rol_id: 2,
        rol_nombre: 'tecnico',
        activo: false,
        rol_activo: true,
        ultimo_acceso: new Date()
      }]);
  
      await authController.verificarSesion(req, res);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INVALID_SESSION'
      }));
    });
  
    it('debe incluir información de permisos correctos', async () => {
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'admin@epa.gov.co',
        nombres: 'Admin',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Administrador',
        rol_id: 1,
        rol_nombre: 'administrador',
        activo: true,
        rol_activo: true,
        ultimo_acceso: new Date()
      }]);
  
      req.user.rol_nombre = 'administrador';
  
      await authController.verificarSesion(req, res);
  
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          permisos: {
            es_admin: true,
            es_tecnico: false,
            es_usuario_final: false
          }
        })
      }));
    });
  
    it('debe incluir token_info en la respuesta', async () => {
      mockSql.mockResolvedValue([{
        id: 1,
        email: 'test@epa.gov.co',
        nombres: 'Test',
        apellidos: 'User',
        telefono: '1234567890',
        departamento: 'TI',
        cargo: 'Técnico',
        rol_id: 2,
        rol_nombre: 'tecnico',
        activo: true,
        rol_activo: true,
        ultimo_acceso: new Date()
      }]);
  
      await authController.verificarSesion(req, res);
  
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          user: expect.objectContaining({
            session_info: req.user.token_info
          })
        })
      }));
    });
  
    it('debe retornar 500 si hay error en la base de datos', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));
  
      await authController.verificarSesion(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'INTERNAL_SERVER_ERROR'
      }));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });