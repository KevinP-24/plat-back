import { jest } from '@jest/globals';

// --- Mock manual de sql ---
const mockSql = jest.fn();

// --- Registrar mock del módulo ---
jest.unstable_mockModule('../../config/db.js', () => ({
  default: mockSql
}));

// --- Importar el controlador DESPUÉS del mock ---
const { default: CategoriaController } = await import('../../controllers/categoria.controller.js');



// ============================================================================
// TESTS PARA obtenerCategorias
// ============================================================================

describe('CategoriaController - obtenerCategorias', () => {
    let req, res, categoriaController, consoleErrorSpy;
  
    beforeEach(() => {
      req = {
        query: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      categoriaController = new CategoriaController();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
  
    it('debe retornar todas las categorías con valores por defecto', async () => {
      const mockCategorias = [
        {
          id: 1,
          nombre: 'Hardware',
          descripcion: 'Problemas de hardware',
          activo: true,
          fecha_creacion: new Date()
        },
        {
          id: 2,
          nombre: 'Software',
          descripcion: 'Problemas de software',
          activo: true,
          fecha_creacion: new Date()
        }
      ];
  
      mockSql.mockResolvedValue(mockCategorias);
  
      await categoriaController.obtenerCategorias(req, res);
  
      expect(mockSql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategorias
      });
    });
  
    it('debe aplicar límite personalizado cuando se proporciona', async () => {
      req.query = { limit: '10' };
      
      const mockCategorias = [
        { id: 1, nombre: 'Cat1', descripcion: 'Desc1', activo: true, fecha_creacion: new Date() }
      ];
  
      // Mock para manejar las consultas encadenadas
      mockSql.mockImplementation(() => Promise.resolve(mockCategorias));
  
      await categoriaController.obtenerCategorias(req, res);
  
      // Verificar que se llamó con limit
      const calls = mockSql.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toContain(10); // limit convertido a int
  
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    it('debe aplicar offset cuando se proporciona', async () => {
      req.query = { offset: '20' };
      
      const mockCategorias = [];
      mockSql.mockImplementation(() => Promise.resolve(mockCategorias));
  
      await categoriaController.obtenerCategorias(req, res);
  
      // Verificar que se llamó con offset
      const calls = mockSql.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toContain(20); // offset convertido a int
  
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    it('debe filtrar por categorías activas cuando activo=true', async () => {
      req.query = { activo: 'true' };
      
      const mockCategorias = [
        { id: 1, nombre: 'Hardware', descripcion: 'Desc', activo: true, fecha_creacion: new Date() }
      ];
  
      mockSql.mockImplementation(() => Promise.resolve(mockCategorias));
  
      await categoriaController.obtenerCategorias(req, res);
  
      // Verificar que se llamó con true para activo
      const calls = mockSql.mock.calls;
      expect(calls.some(call => call.includes(true))).toBe(true);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategorias
      });
    });
  
    it('debe filtrar por categorías inactivas cuando activo=false', async () => {
      req.query = { activo: 'false' };
      
      const mockCategorias = [
        { id: 3, nombre: 'Desactivada', descripcion: 'Desc', activo: false, fecha_creacion: new Date() }
      ];
  
      mockSql.mockImplementation(() => Promise.resolve(mockCategorias));
  
      await categoriaController.obtenerCategorias(req, res);
  
      // Verificar que se llamó con false para activo
      const calls = mockSql.mock.calls;
      expect(calls.some(call => call.includes(false))).toBe(true);
  
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    it('debe retornar array vacío si no hay categorías', async () => {
      mockSql.mockResolvedValue([]);
  
      await categoriaController.obtenerCategorias(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  
    it('debe aplicar múltiples query params juntos', async () => {
      req.query = { activo: 'true', limit: '25', offset: '10' };
      
      const mockCategorias = [
        { id: 1, nombre: 'Cat1', descripcion: 'Desc1', activo: true, fecha_creacion: new Date() }
      ];
  
      mockSql.mockImplementation(() => Promise.resolve(mockCategorias));
  
      await categoriaController.obtenerCategorias(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategorias
      });
    });
  
    it('debe usar valores por defecto para limit y offset si no se proporcionan', async () => {
      req.query = {};
      
      mockSql.mockImplementation(() => Promise.resolve([]));
  
      await categoriaController.obtenerCategorias(req, res);
  
      // Verificar que se usaron los valores por defecto (50 y 0)
      const calls = mockSql.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toContain(50); // limit por defecto
      expect(lastCall).toContain(0);  // offset por defecto
  
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    it('debe retornar 500 si hay error en la base de datos', async () => {
      mockSql.mockImplementation(() => {
        throw new Error('Database error');
      });
  
      await categoriaController.obtenerCategorias(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  
    it('debe manejar límites numéricos correctamente', async () => {
      req.query = { limit: '100', offset: '50' };
      
      mockSql.mockImplementation(() => Promise.resolve([]));
  
      await categoriaController.obtenerCategorias(req, res);
  
      const calls = mockSql.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toContain(100);
      expect(lastCall).toContain(50);
  
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
  
  

// ============================================================================
// TESTS PARA obtenerCategoriaPorId
// ============================================================================

describe('CategoriaController - obtenerCategoriaPorId', () => {
    let req, res, categoriaController, consoleErrorSpy;
  
    beforeEach(() => {
      req = {
        params: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      categoriaController = new CategoriaController();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
  
    it('debe retornar una categoría por ID válido', async () => {
      req.params = { id: '1' };
      
      const mockCategoria = {
        id: 1,
        nombre: 'Hardware',
        descripcion: 'Problemas de hardware',
        activo: true,
        fecha_creacion: new Date()
      };
  
      mockSql.mockResolvedValue([mockCategoria]);
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(mockSql).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategoria
      });
    });
  
    it('debe retornar 400 si el ID no es un número', async () => {
      req.params = { id: 'abc' };
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de categoría inválido'
      });
      expect(mockSql).not.toHaveBeenCalled();
    });
  
    it('debe retornar 400 si el ID está vacío', async () => {
      req.params = { id: '' };
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de categoría inválido'
      });
      expect(mockSql).not.toHaveBeenCalled();
    });
  
    it('debe retornar 400 si el ID es null', async () => {
      req.params = { id: null };
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de categoría inválido'
      });
      expect(mockSql).not.toHaveBeenCalled();
    });
  
    it('debe retornar 400 si el ID es undefined', async () => {
      req.params = {};
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de categoría inválido'
      });
      expect(mockSql).not.toHaveBeenCalled();
    });
  
    it('debe retornar 404 si la categoría no existe', async () => {
      req.params = { id: '999' };
      
      mockSql.mockResolvedValue([]);
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Categoría no encontrada'
      });
    });
  
    it('debe convertir el ID string a número antes de consultar', async () => {
      req.params = { id: '5' };
      
      const mockCategoria = {
        id: 5,
        nombre: 'Red',
        descripcion: 'Problemas de red',
        activo: true,
        fecha_creacion: new Date()
      };
  
      mockSql.mockResolvedValue([mockCategoria]);
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      // Verificar que se llamó con el ID convertido a número
      const calls = mockSql.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toContain(5); // ID como número
  
      expect(res.status).toHaveBeenCalledWith(200);
    });
  
    it('debe manejar IDs numéricos grandes correctamente', async () => {
      req.params = { id: '1000000' };
      
      mockSql.mockResolvedValue([]);
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
    });
  
    it('debe retornar 500 si hay error en la base de datos', async () => {
      req.params = { id: '1' };
      
      mockSql.mockImplementation(() => Promise.reject(new Error('Database error')));
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  
    it('debe retornar solo la primera categoría si hay múltiples resultados', async () => {
      req.params = { id: '1' };
      
      const mockCategorias = [
        { id: 1, nombre: 'Cat1', descripcion: 'Desc1', activo: true, fecha_creacion: new Date() },
        { id: 1, nombre: 'Cat2', descripcion: 'Desc2', activo: true, fecha_creacion: new Date() }
      ];
  
      mockSql.mockResolvedValue(mockCategorias);
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategorias[0] // Solo el primero
      });
    });
  
    it('debe incluir todos los campos en la respuesta', async () => {
      req.params = { id: '1' };
      
      const mockCategoria = {
        id: 1,
        nombre: 'Hardware',
        descripcion: 'Problemas de hardware',
        activo: true,
        fecha_creacion: new Date('2024-01-01')
      };
  
      mockSql.mockResolvedValue([mockCategoria]);
  
      await categoriaController.obtenerCategoriaPorId(req, res);
  
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 1,
          nombre: 'Hardware',
          descripcion: 'Problemas de hardware',
          activo: true,
          fecha_creacion: expect.any(Date)
        })
      });
    });
  });