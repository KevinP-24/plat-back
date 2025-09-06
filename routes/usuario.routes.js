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

/**
 * @swagger
 * /api/usuarios/activar:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Activar cuenta de usuario
 *     description: |
 *       Activa la cuenta de un usuario mediante código de verificación de 6 dígitos.
 *       Este endpoint permite activar cuentas de usuarios registrados en el sistema PLAT-EPA
 *       utilizando el código de activación enviado por email.
 *     operationId: activarCuenta
 *     security: []
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
 *                 example: usuario@epa.gov.co
 *               codigo:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *                 description: Código de activación de 6 dígitos
 *                 example: "123456"
 *           examples:
 *             activacion_exitosa:
 *               summary: Activación exitosa
 *               value:
 *                 email: "tecnico@epa.gov.co"
 *                 codigo: "784521"
 *             codigo_invalido:
 *               summary: Código inválido
 *               value:
 *                 email: "usuario@epa.gov.co"
 *                 codigo: "000000"
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
 *                           description: ID único del usuario
 *                           example: 123
 *                         email:
 *                           type: string
 *                           format: email
 *                           description: Email del usuario
 *                           example: "juan.perez@epa.gov.co"
 *                         nombres:
 *                           type: string
 *                           description: Nombres del usuario
 *                           example: "Juan Carlos"
 *                         apellidos:
 *                           type: string
 *                           description: Apellidos del usuario
 *                           example: "Pérez García"
 *                         activo:
 *                           type: boolean
 *                           description: Estado de activación de la cuenta
 *                           example: true
 *                         rol:
 *                           type: string
 *                           description: Rol del usuario en el sistema
 *                           enum: [Administrador, Técnico, Usuario Final]
 *                           example: "Técnico"
 *                     activacion:
 *                       type: object
 *                       properties:
 *                         fecha_activacion:
 *                           type: string
 *                           format: date-time
 *                           description: Fecha y hora de la activación
 *                           example: "2025-09-06T10:30:00.000Z"
 *                         email_confirmacion_enviado:
 *                           type: boolean
 *                           description: Indica si se envió email de confirmación
 *                           example: true
 *                         puede_iniciar_sesion:
 *                           type: boolean
 *                           description: Indica si puede iniciar sesión inmediatamente
 *                           example: true
 *       400:
 *         description: Error en los datos de entrada o validación
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
 *                 error:
 *                   type: string
 *                   enum: 
 *                     - INVALID_EMAIL
 *                     - INVALID_CODE_FORMAT
 *                     - ACCOUNT_ALREADY_ACTIVE
 *                     - INVALID_OR_USED_CODE
 *                     - CODE_EXPIRED
 *                 data:
 *                   type: object
 *                   nullable: true
 *             examples:
 *               email_invalido:
 *                 summary: Email inválido
 *                 value:
 *                   success: false
 *                   message: "El email es requerido y debe ser válido"
 *                   error: "INVALID_EMAIL"
 *               codigo_formato_invalido:
 *                 summary: Formato de código inválido
 *                 value:
 *                   success: false
 *                   message: "El código de activación debe tener exactamente 6 dígitos"
 *                   error: "INVALID_CODE_FORMAT"
 *               cuenta_ya_activa:
 *                 summary: Cuenta ya activada
 *                 value:
 *                   success: false
 *                   message: "Esta cuenta ya se encuentra activa. Puedes iniciar sesión normalmente"
 *                   error: "ACCOUNT_ALREADY_ACTIVE"
 *               codigo_incorrecto:
 *                 summary: Código incorrecto o usado
 *                 value:
 *                   success: false
 *                   message: "El código de activación es incorrecto o ya ha sido utilizado"
 *                   error: "INVALID_OR_USED_CODE"
 *               codigo_expirado:
 *                 summary: Código expirado
 *                 value:
 *                   success: false
 *                   message: "El código de activación ha expirado. Solicita un nuevo código"
 *                   error: "CODE_EXPIRED"
 *                   data:
 *                     expiro_en: "2025-09-06T09:30:00.000Z"
 *                     puede_reenviar: true
 *       404:
 *         description: Usuario no encontrado
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
 *                   example: "No se encontró ninguna cuenta asociada a este email"
 *                 error:
 *                   type: string
 *                   example: "USER_NOT_FOUND"
 *       500:
 *         description: Error interno del servidor
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
 *                 error:
 *                   type: string
 *                   enum:
 *                     - DATABASE_ERROR
 *                     - INTERNAL_SERVER_ERROR
 *             examples:
 *               error_base_datos:
 *                 summary: Error de base de datos
 *                 value:
 *                   success: false
 *                   message: "Error interno al activar la cuenta. Intenta nuevamente"
 *                   error: "DATABASE_ERROR"
 *               error_interno:
 *                 summary: Error interno general
 *                 value:
 *                   success: false
 *                   message: "Error interno del servidor. Por favor, intenta más tarde"
 *                   error: "INTERNAL_SERVER_ERROR"
 */
router.post('/activar', usuariosController.activarCuenta);

/**
 * @swagger
 * /api/usuarios/reenviar-codigo:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Reenviar código de activación
 *     description: |
 *       Reenvía un nuevo código de activación para cuentas no activadas del sistema PLAT-EPA.
 *       Este endpoint permite a usuarios que no han activado su cuenta solicitar un nuevo código
 *       de 6 dígitos por email. Incluye protección contra spam con límite de 5 códigos por día.
 *     operationId: reenviarCodigoActivacion
 *     security: []
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
 *                 description: Email del usuario que necesita reenvío del código
 *                 example: usuario@epa.gov.co
 *           examples:
 *             reenvio_exitoso:
 *               summary: Solicitud de reenvío válida
 *               value:
 *                 email: "tecnico@epa.gov.co"
 *             cuenta_activa:
 *               summary: Cuenta ya activada
 *               value:
 *                 email: "admin@epa.gov.co"
 *     responses:
 *       200:
 *         description: Código de activación reenviado exitosamente
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
 *                       format: email
 *                       description: Email al que se envió el código
 *                       example: "usuario@epa.gov.co"
 *                     codigo_enviado:
 *                       type: boolean
 *                       description: Indica si el email fue enviado exitosamente
 *                       example: true
 *             example:
 *               success: true
 *               message: "Se ha enviado un nuevo código de activación a tu email"
 *               data:
 *                 email: "tecnico@epa.gov.co"
 *                 codigo_enviado: true
 *       400:
 *         description: Error en los datos de entrada o cuenta ya activa
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
 *             examples:
 *               email_invalido:
 *                 summary: Email inválido o faltante
 *                 value:
 *                   success: false
 *                   message: "El email es requerido y debe ser válido"
 *               cuenta_ya_activa:
 *                 summary: Cuenta ya está activada
 *                 value:
 *                   success: false
 *                   message: "Esta cuenta ya está activada"
 *       404:
 *         description: Usuario no encontrado
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
 *                   example: "No se encontró una cuenta con ese email"
 *             example:
 *               success: false
 *               message: "No se encontró una cuenta con ese email"
 *       429:
 *         description: Límite de reenvíos excedido (Too Many Requests)
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
 *                   example: "Has alcanzado el límite de códigos por día. Intenta mañana"
 *             example:
 *               success: false
 *               message: "Has alcanzado el límite de códigos por día. Intenta mañana"
 *       500:
 *         description: Error interno del servidor
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
 *                   example: "Error interno del servidor"
 *             example:
 *               success: false
 *               message: "Error interno del servidor"
 * 
 * components:
 *   schemas:
 *     ReenviarCodigoRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario para reenvío
 *           example: "usuario@epa.gov.co"
 *       example:
 *         email: "tecnico@epa.gov.co"
 * 
 *     ReenviarCodigoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si la operación fue exitosa
 *         message:
 *           type: string
 *           description: Mensaje descriptivo del resultado
 *         data:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: Email al que se envió el código
 *             codigo_enviado:
 *               type: boolean
 *               description: Indica si el email fue enviado exitosamente
 *       example:
 *         success: true
 *         message: "Se ha enviado un nuevo código de activación a tu email"
 *         data:
 *           email: "usuario@epa.gov.co"
 *           codigo_enviado: true
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Descripción del error
 *       example:
 *         success: false
 *         message: "Descripción del error"
 */
router.post('/reenviar-activacion', usuariosController.reenviarCodigoActivacion);

export default router;