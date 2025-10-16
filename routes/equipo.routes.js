import express from 'express';
import EquipoController from '../controllers/equipo.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/roles.js';

const router = express.Router();
const equipoController = new EquipoController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Equipo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del equipo
 *           example: 1
 *         codigo_inventario:
 *           type: string
 *           description: Código único de inventario
 *           example: "EQ-001-2025"
 *         nombre:
 *           type: string
 *           description: Nombre del equipo
 *           example: "Computador HP EliteDesk"
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del equipo
 *           example: "Computador de escritorio para tareas administrativas"
 *         tipo_equipo_id:
 *           type: integer
 *           description: ID del tipo de equipo
 *           example: 1
 *         marca_id:
 *           type: integer
 *           description: ID de la marca
 *           example: 1
 *         modelo:
 *           type: string
 *           description: Modelo del equipo
 *           example: "EliteDesk 800 G6"
 *         numero_serie:
 *           type: string
 *           description: Número de serie del equipo
 *           example: "HP123456789"
 *         especificaciones:
 *           type: object
 *           description: Especificaciones técnicas en formato JSON
 *           example: {"cpu": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}
 *         estado_id:
 *           type: integer
 *           description: ID del estado actual del equipo
 *           example: 1
 *         ubicacion_id:
 *           type: integer
 *           description: ID de la ubicación del equipo
 *           example: 1
 *         usuario_asignado_id:
 *           type: integer
 *           nullable: true
 *           description: ID del usuario asignado al equipo
 *           example: 123
 *         fecha_adquisicion:
 *           type: string
 *           format: date
 *           description: Fecha de adquisición del equipo
 *           example: "2025-01-15"
 *         fecha_garantia:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Fecha de vencimiento de garantía
 *           example: "2027-01-15"
 *         valor_compra:
 *           type: number
 *           description: Valor de compra del equipo
 *           example: 1500000.00
 *         proveedor:
 *           type: string
 *           description: Proveedor del equipo
 *           example: "TechSolutions S.A.S"
 *         observaciones:
 *           type: string
 *           nullable: true
 *           description: Observaciones adicionales
 *           example: "Equipo en excelente estado"
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *           example: "2025-01-15T10:30:00.000Z"
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2025-01-15T10:30:00.000Z"
 *     
 *     EquipoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Equipo'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Equipo'
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error interno del servidor"
 */

/**
 * @swagger
 * /api/equipo:
 *   get:
 *     summary: Obtiene todos los equipos
 *     description: Recupera una lista de todos los equipos del inventario con filtros opcionales
 *     tags: [Equipo]
 *     parameters:
 *       - in: query
 *         name: estado_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtrar por ID del estado del equipo
 *         example: 1
 *       - in: query
 *         name: tipo_equipo_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtrar por ID del tipo de equipo
 *         example: 1
 *       - in: query
 *         name: usuario_asignado_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtrar por ID del usuario asignado
 *         example: 123
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número máximo de registros a devolver
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Número de registros a omitir
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de equipos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EquipoResponse'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 1
 *                       codigo_inventario: "EQ-001-2025"
 *                       nombre: "Computador HP EliteDesk"
 *                       descripcion: "Computador de escritorio para tareas administrativas"
 *                       tipo_equipo_id: 1
 *                       marca_id: 1
 *                       modelo: "EliteDesk 800 G6"
 *                       numero_serie: "HP123456789"
 *                       estado_id: 1
 *                       ubicacion_id: 1
 *                       usuario_asignado_id: 123
 *                       fecha_adquisicion: "2025-01-15"
 *                       valor_compra: 1500000.00
 *                       proveedor: "TechSolutions S.A.S"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', equipoController.obtenerEquipos);

/**
 * @swagger
 * /api/equipo/{id}:
 *   get:
 *     summary: Obtiene un equipo por ID
 *     description: Recupera los detalles de un equipo específico mediante su ID
 *     tags: [Equipo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del equipo
 *         example: 1
 *     responses:
 *       200:
 *         description: Equipo encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EquipoResponse'
 *             examples:
 *               success:
 *                 summary: Equipo encontrado
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     codigo_inventario: "EQ-001-2025"
 *                     nombre: "Computador HP EliteDesk"
 *                     descripcion: "Computador de escritorio para tareas administrativas"
 *                     tipo_equipo_id: 1
 *                     marca_id: 1
 *                     modelo: "EliteDesk 800 G6"
 *                     numero_serie: "HP123456789"
 *                     especificaciones:
 *                       cpu: "Intel i5"
 *                       ram: "8GB"
 *                       storage: "256GB SSD"
 *                     estado_id: 1
 *                     ubicacion_id: 1
 *                     usuario_asignado_id: 123
 *                     fecha_adquisicion: "2025-01-15"
 *                     fecha_garantia: "2027-01-15"
 *                     valor_compra: 1500000.00
 *                     proveedor: "TechSolutions S.A.S"
 *                     observaciones: "Equipo en excelente estado"
 *                     fecha_creacion: "2025-01-15T10:30:00.000Z"
 *                     fecha_actualizacion: "2025-01-15T10:30:00.000Z"
 *       400:
 *         description: ID de equipo inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_id:
 *                 summary: ID inválido
 *                 value:
 *                   success: false
 *                   message: "ID de equipo inválido"
 *       404:
 *         description: Equipo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Equipo no encontrado
 *                 value:
 *                   success: false
 *                   message: "Equipo no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', equipoController.obtenerEquipoPorId);

/**
 * @swagger
 * /api/equipo:
 *   post:
 *     summary: Registrar un nuevo equipo en el inventario
 *     description: |
 *       Crea un nuevo registro de equipo tecnológico en el inventario institucional.
 *       Solo los usuarios con rol **Administrador** pueden crear nuevos equipos.
 *       
 *       **Proceso automático:**
 *       - Valida campos obligatorios (código, nombre, tipo, marca, modelo)
 *       - Verifica unicidad de `codigo_inventario`
 *       - Registra las fechas de creación y actualización
 *       
 *       **Campos opcionales:**
 *       - Especificaciones (JSON)
 *       - Usuario asignado
 *       - Fechas de adquisición y garantía
 *       - Valor de compra y proveedor
 *       
 *       **Siguiente paso:**
 *       El técnico o administrador podrá actualizar el estado, asignar un usuario o modificar especificaciones.
 *     tags: [Equipo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo_inventario
 *               - nombre
 *               - tipo_equipo_id
 *               - marca_id
 *               - modelo
 *             properties:
 *               codigo_inventario:
 *                 type: string
 *                 description: Código único de inventario del equipo
 *                 example: "EQ-001-2025"
 *               nombre:
 *                 type: string
 *                 description: Nombre descriptivo del equipo
 *                 example: "Computador HP EliteDesk"
 *               descripcion:
 *                 type: string
 *                 description: Descripción detallada del equipo
 *                 example: "Equipo de escritorio para tareas administrativas"
 *               tipo_equipo_id:
 *                 type: integer
 *                 description: ID del tipo de equipo
 *                 example: 1
 *               marca_id:
 *                 type: integer
 *                 description: ID de la marca del equipo
 *                 example: 1
 *               modelo:
 *                 type: string
 *                 description: Modelo comercial del equipo
 *                 example: "EliteDesk 800 G6"
 *               numero_serie:
 *                 type: string
 *                 description: Número de serie del equipo
 *                 example: "HP123456789"
 *               especificaciones:
 *                 type: object
 *                 description: Especificaciones técnicas en formato JSON
 *                 example: {"cpu": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}
 *               estado_id:
 *                 type: integer
 *                 description: ID del estado inicial del equipo
 *                 example: 1
 *               ubicacion_id:
 *                 type: integer
 *                 description: ID de la ubicación física del equipo
 *                 example: 2
 *               usuario_asignado_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID del usuario al que se asigna inicialmente
 *                 example: null
 *               fecha_adquisicion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de adquisición del equipo
 *                 example: "2025-01-15"
 *               fecha_garantia:
 *                 type: string
 *                 format: date
 *                 description: Fecha de vencimiento de garantía
 *                 example: "2027-01-15"
 *               valor_compra:
 *                 type: number
 *                 description: Valor de compra del equipo
 *                 example: 1500000.00
 *               proveedor:
 *                 type: string
 *                 description: Nombre del proveedor o empresa que suministró el equipo
 *                 example: "TechSolutions S.A.S"
 *               observaciones:
 *                 type: string
 *                 description: Observaciones adicionales sobre el equipo
 *                 example: "Equipo nuevo, en excelente estado"
 *     responses:
 *       201:
 *         description: Equipo registrado exitosamente
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
 *                   example: "Equipo registrado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Equipo'
 *             example:
 *               success: true
 *               message: "Equipo registrado exitosamente"
 *               data:
 *                 id: 45
 *                 codigo_inventario: "EQ-001-2025"
 *                 nombre: "Computador HP EliteDesk"
 *                 tipo_equipo_id: 1
 *                 marca_id: 1
 *                 modelo: "EliteDesk 800 G6"
 *                 numero_serie: "HP123456789"
 *                 estado_id: 1
 *                 ubicacion_id: 2
 *                 usuario_asignado_id: null
 *                 fecha_adquisicion: "2025-01-15"
 *                 valor_compra: 1500000
 *                 proveedor: "TechSolutions S.A.S"
 *                 fecha_creacion: "2025-10-07T14:30:00Z"
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "El código de inventario es requerido"
 *               error: "CODIGO_INVENTARIO_REQUERIDO"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Usuario no autenticado"
 *               error: "NO_AUTENTICADO"
 *       403:
 *         description: Permisos insuficientes
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No tienes permisos para registrar equipos"
 *               error: "PERMISOS_INSUFICIENTES"
 *       409:
 *         description: Código de inventario duplicado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Ya existe un equipo con ese código de inventario"
 *               error: "CODIGO_DUPLICADO"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Error interno del servidor"
 *               error: "INTERNAL_SERVER_ERROR"
 */
router.post('/', verifyToken, requireAdmin, equipoController.crearEquipo.bind(equipoController));

/**
 * @swagger
 * /api/equipo/{id}:
 *   put:
 *     summary: Actualizar la información de un equipo
 *     description: |
 *       Permite actualizar los datos de un equipo existente en el inventario.  
 *       Solo los usuarios con rol **Administrador** pueden modificar la información de los equipos.
 *       
 *       **Restricciones:**  
 *       - Los siguientes campos **no pueden ser actualizados**:  
 *         `codigo_inventario`, `valor_compra`, `proveedor`, `fecha_adquisicion`, `fecha_creacion`.  
 *       - Los campos no enviados permanecerán sin cambios.
 *       
 *       **Campos permitidos:**  
 *       - `nombre`, `descripcion`, `tipo_equipo_id`, `marca_id`, `modelo`, `numero_serie`,  
 *         `especificaciones`, `estado_id`, `ubicacion_id`, `usuario_asignado_id`,  
 *         `fecha_garantia`, `observaciones`
 *     tags: [Equipo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del equipo a actualizar
 *         example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre descriptivo del equipo
 *                 example: "Laptop Lenovo ThinkPad"
 *               descripcion:
 *                 type: string
 *                 description: Descripción o propósito del equipo
 *                 example: "Equipo portátil asignado al área de ingeniería"
 *               tipo_equipo_id:
 *                 type: integer
 *                 description: ID del tipo de equipo
 *                 example: 2
 *               marca_id:
 *                 type: integer
 *                 description: ID de la marca
 *                 example: 3
 *               modelo:
 *                 type: string
 *                 description: Modelo del equipo
 *                 example: "ThinkPad X1 Carbon Gen 11"
 *               numero_serie:
 *                 type: string
 *                 description: Número de serie del equipo
 *                 example: "LN123456789"
 *               especificaciones:
 *                 type: object
 *                 description: Especificaciones técnicas en formato JSON
 *                 example: {"cpu": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}
 *               estado_id:
 *                 type: integer
 *                 description: ID del estado actual del equipo
 *                 example: 2
 *               ubicacion_id:
 *                 type: integer
 *                 description: ID de la ubicación física del equipo
 *                 example: 5
 *               usuario_asignado_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID del usuario actualmente asignado
 *                 example: 101
 *               fecha_garantia:
 *                 type: string
 *                 format: date
 *                 description: Fecha de vencimiento de la garantía
 *                 example: "2026-12-31"
 *               observaciones:
 *                 type: string
 *                 description: Notas u observaciones adicionales
 *                 example: "Equipo en revisión técnica por mantenimiento preventivo"
 *     responses:
 *       200:
 *         description: Equipo actualizado exitosamente
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
 *                   example: "Equipo actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Equipo'
 *             example:
 *               success: true
 *               message: "Equipo actualizado exitosamente"
 *               data:
 *                 id: 12
 *                 codigo_inventario: "EQ-015-2025"
 *                 nombre: "Laptop Lenovo ThinkPad"
 *                 descripcion: "Equipo portátil asignado al área de ingeniería"
 *                 tipo_equipo_id: 2
 *                 marca_id: 3
 *                 modelo: "ThinkPad X1 Carbon Gen 11"
 *                 numero_serie: "LN123456789"
 *                 estado_id: 2
 *                 ubicacion_id: 5
 *                 usuario_asignado_id: 101
 *                 fecha_garantia: "2026-12-31"
 *                 observaciones: "Equipo en revisión técnica por mantenimiento preventivo"
 *                 fecha_creacion: "2025-01-15T10:30:00.000Z"
 *                 fecha_actualizacion: "2025-10-07T16:15:00.000Z"
 *       400:
 *         description: Solicitud inválida o campo no permitido
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "El campo \"valor_compra\" no puede ser actualizado"
 *               error: "CAMPO_NO_PERMITIDO"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Usuario no autenticado"
 *               error: "NO_AUTENTICADO"
 *       403:
 *         description: Permisos insuficientes
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No tienes permisos para actualizar equipos"
 *               error: "PERMISOS_INSUFICIENTES"
 *       404:
 *         description: Equipo no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Equipo no encontrado"
 *               error: "EQUIPO_NO_ENCONTRADO"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Error interno del servidor"
 *               error: "INTERNAL_SERVER_ERROR"
 */
router.put('/:id', verifyToken, requireAdmin, equipoController.actualizarEquipo.bind(equipoController));

/**
 * @swagger
 * /api/equipo/{id}/asignar-usuario:
 *   put:
 *     summary: Asigna un equipo a un usuario del sistema
 *     description: |
 *       Permite asignar un equipo existente a un usuario activo en el sistema.
 *       Solo los roles **Administrador** o **Técnico** pueden realizar esta acción.
 *       
 *       Al asignar un equipo, se actualiza el campo `usuario_asignado_id` en la tabla **equipos**
 *       y se registra automáticamente el cambio en el historial (**historial_equipos**),
 *       incluyendo los estados, ubicaciones y usuario anterior.
 *     tags: [Equipo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del equipo a asignar
 *         example: 9
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_nuevo_id
 *             properties:
 *               usuario_nuevo_id:
 *                 type: integer
 *                 description: ID del usuario al que se asignará el equipo
 *                 example: 5
 *               observaciones:
 *                 type: string
 *                 description: Comentario o motivo de la asignación
 *                 example: "Asignación temporal al departamento de ingeniería"
 *     responses:
 *       200:
 *         description: Equipo asignado correctamente al usuario
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
 *                   example: "Equipo asignado correctamente al usuario"
 *                 data:
 *                   type: object
 *                   properties:
 *                     equipo_id:
 *                       type: integer
 *                       example: 9
 *                     nombre_equipo:
 *                       type: string
 *                       example: "Impresora HP LaserJet 2035"
 *                     usuario_nuevo_id:
 *                       type: integer
 *                       example: 5
 *                     nombre_usuario:
 *                       type: string
 *                       example: "Juan Pérez García"
 *                     fecha_cambio:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-11T15:42:00.000Z"
 *                     observaciones:
 *                       type: string
 *                       example: "Asignación temporal al departamento de ingeniería"
 *       400:
 *         description: Solicitud inválida o datos incorrectos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "El ID del nuevo usuario es requerido y debe ser válido"
 *               error: "USUARIO_INVALIDO"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Usuario no autenticado"
 *               error: "NO_AUTENTICADO"
 *       403:
 *         description: Permisos insuficientes
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No tienes permisos para asignar equipos"
 *               error: "PERMISOS_INSUFICIENTES"
 *       404:
 *         description: Equipo o usuario no encontrado
 *         content:
 *           application/json:
 *             examples:
 *               equipo_not_found:
 *                 summary: Equipo no encontrado
 *                 value:
 *                   success: false
 *                   message: "Equipo no encontrado"
 *                   error: "EQUIPO_NO_ENCONTRADO"
 *               user_not_found:
 *                 summary: Usuario no encontrado
 *                 value:
 *                   success: false
 *                   message: "Usuario no encontrado o inactivo"
 *                   error: "USUARIO_INVALIDO"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Error interno del servidor"
 *               error: "INTERNAL_SERVER_ERROR"
 */
router.put('/:id/asignar-usuario', verifyToken, equipoController.asignarEquipoAUsuario.bind(equipoController));

export default router;