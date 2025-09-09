import express from 'express';
import EquipoController from '../controllers/equipo.controller.js';


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

export default router;