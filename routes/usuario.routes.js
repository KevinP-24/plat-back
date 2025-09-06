import express from 'express';
import UsuariosController from '../controllers/usuario.controller.js';
import { validarActivacionCuenta, validarReenvioActivacion } from '../middlewares/validation.js';

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
 *       500:
 *         description: Error interno del servidor
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
 *       400:
 *         description: ID de usuario inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', usuariosController.obtenerUsuarioPorId.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Crea un nuevo usuario en el sistema. El usuario se crea inactivo y se envía un código de activación por email
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_usuario
 *               - email
 *               - nombres
 *               - apellidos
 *               - rol_id
 *               - password
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario único
 *                 example: "juanperez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email único del usuario
 *                 example: "juan.perez@epa.gov.co"
 *               nombres:
 *                 type: string
 *                 description: Nombres del usuario
 *                 example: "Juan Carlos"
 *               apellidos:
 *                 type: string
 *                 description: Apellidos del usuario
 *                 example: "Pérez González"
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario (opcional)
 *                 example: "3001234567"
 *               departamento:
 *                 type: string
 *                 description: Departamento del usuario (opcional)
 *                 example: "TIC"
 *               cargo:
 *                 type: string
 *                 description: Cargo del usuario (opcional)
 *                 example: "Analista de Sistemas"
 *               rol_id:
 *                 type: integer
 *                 description: ID del rol asignado
 *                 example: 2
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña del usuario (mínimo 6 caracteres)
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente. Se envió código de activación por email
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: El usuario ya existe (email o nombre_usuario duplicado)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', usuariosController.crearUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     description: Actualiza los datos de un usuario específico. El email no se puede modificar por seguridad
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
 *             type: object
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *                 description: Nuevo nombre de usuario
 *                 example: "juanperez_updated"
 *               nombres:
 *                 type: string
 *                 description: Nombres actualizados
 *                 example: "Juan Carlos"
 *               apellidos:
 *                 type: string
 *                 description: Apellidos actualizados
 *                 example: "Pérez González"
 *               telefono:
 *                 type: string
 *                 description: Teléfono actualizado
 *                 example: "3009876543"
 *               departamento:
 *                 type: string
 *                 description: Departamento actualizado
 *                 example: "Sistemas"
 *               cargo:
 *                 type: string
 *                 description: Cargo actualizado
 *                 example: "Coordinador de TIC"
 *               rol_id:
 *                 type: integer
 *                 description: Nuevo rol del usuario
 *                 example: 1
 *               activo:
 *                 type: boolean
 *                 description: Estado activo del usuario
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Datos inválidos o ID inválido
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Conflicto - El nombre de usuario ya existe
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', usuariosController.actualizarUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario (soft delete)
 *     description: Marca un usuario como inactivo en lugar de eliminarlo permanentemente de la base de datos
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
 *         description: Usuario eliminado exitosamente (marcado como inactivo)
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
 *         description: ID de usuario inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
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
 *         description: ID de usuario inválido
 *       404:
 *         description: Usuario no encontrado o inactivo
 *       500:
 *         description: Error interno del servidor
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
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Contraseña actual incorrecta
 *       403:
 *         description: Usuario inactivo
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
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
 *     responses:
 *       200:
 *         description: Instrucciones de recuperación enviadas (siempre responde así por seguridad)
 *       400:
 *         description: Email inválido
 *       500:
 *         description: Error interno del servidor
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
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *       400:
 *         description: Token inválido o datos incorrectos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/restablecer-contraseña', usuariosController.restablecerContraseña.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/activar:
 *   post:
 *     summary: Activar cuenta de usuario
 *     description: Activa la cuenta de un usuario usando el código de 6 dígitos enviado por email
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - codigo
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario a activar
 *                 example: "juan.perez@epa.gov.co"
 *               codigo:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *                 description: Código de activación de 6 dígitos
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Cuenta activada exitosamente
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
 *                   example: "¡Felicitaciones Juan! Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nombre_usuario:
 *                           type: string
 *                         email:
 *                           type: string
 *                         nombres:
 *                           type: string
 *                         apellidos:
 *                           type: string
 *                         activo:
 *                           type: boolean
 *                           example: true
 *                     activacion:
 *                       type: object
 *                       properties:
 *                         fecha_activacion:
 *                           type: string
 *                           format: date-time
 *                         email_confirmacion_enviado:
 *                           type: boolean
 *                         puede_iniciar_sesion:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Datos inválidos, cuenta ya activa, código incorrecto o expirado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/activar', validarActivacionCuenta, usuariosController.activarCuenta.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/reenviar-activacion:
 *   post:
 *     summary: Reenviar código de activación
 *     description: Reenvía un nuevo código de activación para cuentas no activadas
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
 *                 description: Email del usuario que necesita reenvío
 *                 example: "juan.perez@epa.gov.co"
 *     responses:
 *       200:
 *         description: Nuevo código enviado exitosamente
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
 *                   example: "Se ha enviado un nuevo código de activación a tu email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     codigo_enviado:
 *                       type: boolean
 *       400:
 *         description: Email inválido o cuenta ya activa
 *       404:
 *         description: Usuario no encontrado
 *       429:
 *         description: Límite de reenvíos alcanzado (máximo 5 por día)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/reenviar-activacion', validarReenvioActivacion, usuariosController.reenviarCodigoActivacion.bind(usuariosController));


// Activación de cuenta - NUEVA RUTA
router.post('/activar', usuariosController.activarCuenta);

// Reenvío de código de activación (opcional)
router.post('/reenviar-activacion', usuariosController.reenviarCodigoActivacion);

export default router;