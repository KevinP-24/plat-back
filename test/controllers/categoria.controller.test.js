import { jest } from '@jest/globals';

// --- Mock manual de sql ---
const mockSql = jest.fn();

// --- Registrar mock del módulo ---
jest.unstable_mockModule('../../config/db.js', () => ({
  default: mockSql
}));

// --- Importar el controlador DESPUÉS del mock ---
const { default: CategoriaController } = await import('../../controllers/categoria.controller.js');


