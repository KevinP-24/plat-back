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

