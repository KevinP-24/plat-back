import express from 'express';
import UsuariosController from '../controllers/usuario.controller.js';

const router = express.Router();
const usuariosController = new UsuariosController();

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Retorna una lista de todos los usuarios del sistema con filtros opcionales
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *         example: true
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *         description: Filtrar por departamento
 *         example: "TIC"
 *       - in: query
 *         name: rol_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de rol
 *         example: 1
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombres, apellidos, email o nombre de usuario
 *         example: "juan"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Desplazamiento para paginación
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', usuariosController.obtenerUsuarios.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     description: Retorna un usuario específico basado en su ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del usuario
 *         example: 1
 *     responses:
 *       200:
 *         description: Usuario encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', usuariosController.obtenerUsuarioPorId.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Crea un nuevo usuario en el sistema con contraseña encriptada
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *           example:
 *             nombre_usuario: "juanperez"
 *             email: "juan.perez@epa.gov.co"
 *             nombres: "Juan Carlos"
 *             apellidos: "Pérez González"
 *             telefono: "3001234567"
 *             departamento: "TIC"
 *             cargo: "Analista de Sistemas"
 *             rol_id: 2
 *             password: "password123"
 *             activo: true
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
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
 *                   example: "Usuario creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Conflicto - El usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Ya existe un usuario con ese nombre de usuario"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', usuariosController.crearUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     description: Actualiza los datos de un usuario específico (excepto email)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioUpdate'
 *           example:
 *             nombre_usuario: "juanperez_updated"
 *             nombres: "Juan Carlos"
 *             apellidos: "Pérez González"
 *             telefono: "3009876543"
 *             departamento: "Sistemas"
 *             cargo: "Coordinador de TIC"
 *             rol_id: 1
 *             activo: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
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
 *                   example: "Usuario actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflicto - El nombre de usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Ya existe otro usuario con ese nombre de usuario"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', usuariosController.actualizarUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario (soft delete)
 *     description: Marca un usuario como inactivo en lugar de eliminarlo permanentemente
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
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
 *                   example: "Usuario eliminado exitosamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', usuariosController.eliminarUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}/ultimo-acceso:
 *   patch:
 *     summary: Actualizar último acceso del usuario
 *     description: Actualiza el timestamp del último acceso del usuario al sistema
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *         example: 1
 *     responses:
 *       200:
 *         description: Último acceso actualizado exitosamente
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
 *                   example: "Último acceso actualizado exitosamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:id/ultimo-acceso', usuariosController.actualizarUltimoAcceso.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}/cambiar-contraseña:
 *   patch:
 *     summary: Cambiar contraseña del usuario
 *     description: Permite al usuario cambiar su contraseña proporcionando la actual y la nueva
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passwordActual
 *               - passwordNueva
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *                 example: "password123"
 *               passwordNueva:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña (mínimo 6 caracteres)
 *                 example: "newPassword456"
 *           example:
 *             passwordActual: "password123"
 *             passwordNueva: "newPassword456"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
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
 *                   example: "Contraseña actualizada exitosamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Contraseña actual incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "La contraseña actual es incorrecta"
 *       403:
 *         description: Usuario inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Usuario inactivo"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:id/cambiar-contraseña', usuariosController.cambiarContraseña.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/recuperar-contraseña:
 *   post:
 *     summary: Recuperar contraseña
 *     description: Genera un token de recuperación y envía instrucciones por email
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario para recuperar contraseña
 *                 example: "juan.perez@epa.gov.co"
 *           example:
 *             email: "juan.perez@epa.gov.co"
 *     responses:
 *       200:
 *         description: Instrucciones de recuperación enviadas (siempre responde así por seguridad)
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
 *                   example: "Si el email está registrado, recibirás las instrucciones de recuperación"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/recuperar-contraseña', usuariosController.recuperarContraseña.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/restablecer-contraseña:
 *   post:
 *     summary: Restablecer contraseña con token
 *     description: Restablece la contraseña usando un token válido de recuperación
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - passwordNueva
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de recuperación recibido por email
 *                 example: "a1b2c3d4e5f6789012345678901234567890abcdef"
 *               passwordNueva:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña (mínimo 6 caracteres)
 *                 example: "newPassword789"
 *           example:
 *             token: "a1b2c3d4e5f6789012345678901234567890abcdef"
 *             passwordNueva: "newPassword789"
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
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
 *                   example: "Contraseña restablecida exitosamente"
 *       400:
 *         description: Token inválido o datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Token inválido o expirado"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/restablecer-contraseña', usuariosController.restablecerContraseña.bind(usuariosController));


// Activación de cuenta - NUEVA RUTA
router.post('/activar', usuariosController.activarCuenta);

// Reenvío de código de activación (opcional)
router.post('/reenviar-activacion', usuariosController.reenviarCodigoActivacion);

export default router;