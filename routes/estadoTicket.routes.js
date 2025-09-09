import express from 'express';
import EstadosTicketController from '../controllers/estadoTicket.controller.js';

const router = express.Router();
const estadosTicketController = new EstadosTicketController();

/**
 * @swagger
 * components:
 *   schemas:
 *     EstadoTicket:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del estado de ticket
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del estado
 *           example: "Pendiente"
 *         descripcion:
 *           type: string
 *           description: Descripción del estado
 *           example: "Ticket recién creado"
 *         es_final:
 *           type: boolean
 *           description: Indica si es un estado final
 *           example: false
 *         orden:
 *           type: integer
 *           description: Orden de secuencia del estado
 *           example: 1
 *         activo:
 *           type: boolean
 *           description: Estado activo/inactivo
 *           example: true
 *     
 *     EstadoTicketResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/EstadoTicket'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/EstadoTicket'
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
 * /api/estados-ticket:
 *   get:
 *     summary: Obtiene todos los estados de ticket
 *     description: Recupera una lista de todos los estados de ticket con filtros opcionales
 *     tags: [Estados de Ticket]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por estados activos o inactivos
 *         example: "true"
 *       - in: query
 *         name: es_final
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por estados finales o no finales
 *         example: "false"
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
 *         description: Lista de estados de ticket obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstadoTicketResponse'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 1
 *                       nombre: "Pendiente"
 *                       descripcion: "Ticket recién creado"
 *                       es_final: false
 *                       orden: 1
 *                       activo: true
 *                     - id: 2
 *                       nombre: "En Progreso"
 *                       descripcion: "Ticket en resolución"
 *                       es_final: false
 *                       orden: 2
 *                       activo: true
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', estadosTicketController.obtenerEstadosTicket);

/**
 * @swagger
 * /api/estados-ticket/{id}:
 *   get:
 *     summary: Obtiene un estado de ticket por ID
 *     description: Recupera los detalles de un estado de ticket específico mediante su ID
 *     tags: [Estados de Ticket]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del estado de ticket
 *         example: 1
 *     responses:
 *       200:
 *         description: Estado de ticket encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstadoTicketResponse'
 *             examples:
 *               success:
 *                 summary: Estado encontrado
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     nombre: "Pendiente"
 *                     descripcion: "Ticket recién creado"
 *                     es_final: false
 *                     orden: 1
 *                     activo: true
 *       400:
 *         description: ID de estado de ticket inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_id:
 *                 summary: ID inválido
 *                 value:
 *                   success: false
 *                   message: "ID de estado de ticket inválido"
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Estado de ticket no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Estado no encontrado
 *                 value:
 *                   success: false
 *                   message: "Estado de ticket no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', estadosTicketController.obtenerEstadoTicketPorId);

export default router;