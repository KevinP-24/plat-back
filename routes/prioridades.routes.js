import express from 'express';
import PrioridadesController from '../controllers/prioridades.controller.js';

const router = express.Router();
const prioridadesController = new PrioridadesController();

/**
 * @swagger
 * /api/prioridades:
 *   get:
 *     summary: Obtener todas las prioridades
 *     description: Retorna una lista de todas las prioridades del sistema con filtros opcionales, ordenadas por nivel
 *     tags: [Prioridades]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *         example: true
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
 *         description: Lista de prioridades obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Prioridad'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   nombre: "Alta"
 *                   nivel: 1
 *                   color: "#FF4444"
 *                   descripcion: "Problemas críticos"
 *                   activo: true
 *                   fecha_creacion: "2025-01-15T10:00:00.000Z"
 *                   fecha_actualizacion: "2025-01-15T10:00:00.000Z"
 *                 - id: 2
 *                   nombre: "Media"
 *                   nivel: 2
 *                   color: "#FFA500"
 *                   descripcion: "Problemas importantes"
 *                   activo: true
 *                   fecha_creacion: "2025-01-15T10:00:00.000Z"
 *                   fecha_actualizacion: "2025-01-15T10:00:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', prioridadesController.obtenerPrioridades);

/**
 * @swagger
 * /api/prioridades/{id}:
 *   get:
 *     summary: Obtener una prioridad por ID
 *     description: Retorna una prioridad específica basada en su ID
 *     tags: [Prioridades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la prioridad
 *         example: 1
 *     responses:
 *       200:
 *         description: Prioridad encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Prioridad'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 nombre: "Alta"
 *                 nivel: 1
 *                 color: "#FF4444"
 *                 descripcion: "Problemas críticos"
 *                 activo: true
 *                 fecha_creacion: "2025-01-15T10:00:00.000Z"
 *                 fecha_actualizacion: "2025-01-15T10:00:00.000Z"
 *       400:
 *         description: ID de prioridad inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "ID de prioridad inválido"
 *       404:
 *         description: Prioridad no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Prioridad no encontrada"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', prioridadesController.obtenerPrioridadPorId);

export default router;