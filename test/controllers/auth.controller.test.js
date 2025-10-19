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

