import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

// Instancia real del controlador
import authController from '../controllers/auth.controller.js';

// Copias locales de módulos “frozen”
import * as realBcrypt from 'bcryptjs';
const bcrypt = { ...realBcrypt };

import * as realJwt from '../utils/jwt.js';
const jwtUtils = { ...realJwt };

// Helper para simular Express
function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

// Configuración inicial de mocks simples
beforeEach(() => {
  bcrypt.compare = async () => false;
  jwtUtils.generateToken = () => 'fakeAccessToken';
  jwtUtils.generateRefreshToken = () => 'fakeRefreshToken';
});

describe('AuthController.login()', () => {
  test('debe retornar 400 si faltan email o password', async () => {
    const req = { body: {} };
    const res = fakeRes();

    await authController.login(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'MISSING_CREDENTIALS');
  });

  test('debe retornar 401 si el usuario no existe', async () => {
    // Mock de la base de datos vacío
    authController.sql = async () => [];

    const req = {
      body: { email: 'noexiste@epa.gov.co', password: '123456' },
      ip: '::1',
      get: () => 'test'
    };
    const res = fakeRes();

    await authController.login(req, res);

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'INVALID_CREDENTIALS');
  });

  test('debe retornar 401 si la contraseña es incorrecta', async () => {
    // Mock: usuario encontrado, contraseña incorrecta
    const mockUser = [{
      id: 1,
      email: 'user@epa.gov.co',
      nombres: 'User',
      apellidos: 'Test',
      rol_id: 1,
      rol_nombre: 'Administrador',
      activo: true,
      rol_activo: true,
      password: 'hash',
      fecha_creacion: new Date()
    }];

    authController.sql = async () => mockUser;
    bcrypt.compare = async () => false; // contraseña inválida

    const req = {
      body: { email: 'user@epa.gov.co', password: 'badpass' },
      ip: '::1',
      get: () => 'test'
    };
    const res = fakeRes();

    await authController.login(req, res);

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'INVALID_CREDENTIALS');
  });

  test('debe retornar 200 con tokens si login es exitoso', async () => {
    // Mock: usuario válido
    const mockUser = [{
      id: 1,
      email: 'user@epa.gov.co',
      nombres: 'User',
      apellidos: 'Test',
      rol_id: 1,
      rol_nombre: 'Administrador',
      activo: true,
      rol_activo: true,
      password: 'hash',
      fecha_creacion: new Date()
    }];

    // 🔹 Importa dinámicamente el módulo de base de datos y reemplaza su export
    const dbModule = await import('../config/db.js');
    const originalSql = dbModule.default;
    let call = 0;
    Object.defineProperty(dbModule, 'default', {
      value: async () => (call++ === 0 ? mockUser : []),
      configurable: true
    });

    // 🔹 Mocks de bcrypt y JWT
    bcrypt.compare = async () => true;
    jwtUtils.generateToken = () => 'fakeAccessToken';
    jwtUtils.generateRefreshToken = () => 'fakeRefreshToken';

    const req = {
      body: { email: 'user@epa.gov.co', password: '123456' },
      ip: '::1',
      get: () => 'test'
    };
    const res = fakeRes();

    await authController.login(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data.tokens.access_token);

    // 🔹 Restauramos la conexión original
    Object.defineProperty(dbModule, 'default', { value: originalSql });
  });

});
