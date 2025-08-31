// routes/auth.js
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import authController from '../controllers/auth.controller.js';

const router = Router();

// ================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve tokens JWT de acceso y refresh
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario (alternativo a nombre_usuario)
 *                 example: "admin@epa.gov.co"
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario (alternativo a email)
 *                 example: "admin_epa"
 *               password:
 *                 type: string
 *                 minLength: 1
 *                 description: Contraseña del usuario
 *                 example: "password123"
 *             required:
 *               - password
 *             anyOf:
 *               - required: [email]
 *               - required: [nombre_usuario]
 *           examples:
 *             login_con_email:
 *               summary: Login con email
 *               value:
 *                 email: "admin@epa.gov.co"
 *                 password: "password123"
 *             login_con_usuario:
 *               summary: Login con nombre de usuario
 *               value:
 *                 nombre_usuario: "admin_epa"
 *                 password: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "¡Bienvenido Juan!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nombre_usuario:
 *                           type: string
 *                           example: "admin_epa"
 *                         email:
 *                           type: string
 *                           example: "admin@epa.gov.co"
 *                         nombres:
 *                           type: string
 *                           example: "Juan"
 *                         apellidos:
 *                           type: string
 *                           example: "Pérez"
 *                         telefono:
 *                           type: string
 *                           example: "+57 300 123 4567"
 *                         departamento:
 *                           type: string
 *                           example: "Dirección TIC"
 *                         cargo:
 *                           type: string
 *                           example: "Administrador de Sistema"
 *                         rol:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             nombre:
 *                               type: string
 *                               example: "administrador"
 *                         ultimo_acceso:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-01-20T10:30:00Z"
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-01-15T08:00:00Z"
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                           description: JWT token de acceso
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         refresh_token:
 *                           type: string
 *                           description: JWT token de refresh
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         token_type:
 *                           type: string
 *                           example: "Bearer"
 *                         expires_in:
 *                           type: string
 *                           example: "24h"
 *                     permisos:
 *                       type: object
 *                       properties:
 *                         es_admin:
 *                           type: boolean
 *                           example: true
 *                         es_tecnico:
 *                           type: boolean
 *                           example: false
 *                         es_usuario_final:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email/Usuario y contraseña son requeridos"
 *                 error:
 *                   type: string
 *                   example: "MISSING_CREDENTIALS"
 *       401:
 *         description: Credenciales incorrectas o cuenta inactiva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Credenciales incorrectas"
 *                 error:
 *                   type: string
 *                   enum: [INVALID_CREDENTIALS, ACCOUNT_NOT_ACTIVATED, ROLE_INACTIVE]
 *                   example: "INVALID_CREDENTIALS"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@epa.gov.co"
 *                     puede_reactivar:
 *                       type: boolean
 *                       example: true
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/login', authController.login);

// ================================
// RUTAS CON AUTENTICACIÓN REQUERIDA
// ================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Cierra la sesión del usuario autenticado y registra la actividad
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sesión cerrada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     logout_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-20T15:45:30Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     description: Devuelve la información del usuario autenticado y sus permisos
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nombre_usuario:
 *                           type: string
 *                           example: "admin_epa"
 *                         email:
 *                           type: string
 *                           example: "admin@epa.gov.co"
 *                         nombres:
 *                           type: string
 *                           example: "Juan"
 *                         apellidos:
 *                           type: string
 *                           example: "Pérez"
 *                         telefono:
 *                           type: string
 *                           example: "+57 300 123 4567"
 *                         departamento:
 *                           type: string
 *                           example: "Dirección TIC"
 *                         cargo:
 *                           type: string
 *                           example: "Administrador de Sistema"
 *                         rol:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             nombre:
 *                               type: string
 *                               example: "administrador"
 *                         ultimo_acceso:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-01-20T10:30:00Z"
 *                         session_info:
 *                           type: object
 *                           description: Información adicional de la sesión
 *                           properties:
 *                             user_id:
 *                               type: integer
 *                               example: 1
 *                             email:
 *                               type: string
 *                               example: "admin@epa.gov.co"
 *                             role:
 *                               type: string
 *                               example: "administrador"
 *                             username:
 *                               type: string
 *                               example: "admin_epa"
 *                             issued_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-01-20T10:30:00Z"
 *                             expires_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-01-21T10:30:00Z"
 *                     permisos:
 *                       type: object
 *                       properties:
 *                         es_admin:
 *                           type: boolean
 *                           description: Indica si el usuario es administrador
 *                           example: true
 *                         es_tecnico:
 *                           type: boolean
 *                           description: Indica si el usuario es técnico
 *                           example: false
 *                         es_usuario_final:
 *                           type: boolean
 *                           description: Indica si el usuario es usuario final
 *                           example: false
 *       401:
 *         description: Token inválido o sesión expirada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Sesión inválida. Por favor, inicia sesión nuevamente"
 *                 error:
 *                   type: string
 *                   example: "INVALID_SESSION"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me', verifyToken, authController.verificarSesion);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token de acceso (Futuro)
 *     description: Renueva el token de acceso usando un refresh token válido
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token recibido en el login
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     token_type:
 *                       type: string
 *                       example: "Bearer"
 *                     expires_in:
 *                       type: string
 *                       example: "24h"
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// router.post('/refresh', authController.refreshToken);

export default router;