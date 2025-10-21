// routes/historialEquipo.routes.js
import express from 'express';
import HistorialEquipoController from '../controllers/historialEquipo.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();
const historialController = new HistorialEquipoController();

/**
 * @swagger
 * /api/historialEquipo/{id}/historial:
 *   get:
 *     summary: Obtener historial del equipo
 *     description: |
 *       Devuelve todos los eventos registrados en el historial del equipo, incluyendo:
 *       - Asignaciones de usuario
 *       - Asociación con tickets
 *       - Resoluciones o cierres de tickets
 *       - Mantenimientos o actualizaciones
 *       
 *       **Solo accesible para usuarios autenticados.**
 *     tags: [Historial de Equipo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo
 *         example: 5
 *       - in: query
 *         name: tipo_cambio
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de cambio (por ejemplo, "Resolución de ticket")
 *         example: "Resolución de ticket"
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar desde una fecha específica (YYYY-MM-DD)
 *         example: "2025-01-01"
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar hasta una fecha específica (YYYY-MM-DD)
 *         example: "2025-12-31"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados por página
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Desplazamiento para paginación
 *         example: 0
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       equipo_id:
 *                         type: integer
 *                         example: 5
 *                       fecha_cambio:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-12T15:45:00Z"
 *                       tipo_cambio:
 *                         type: string
 *                         example: "Resolución de ticket"
 *                       descripcion:
 *                         type: string
 *                         example: "Ticket TICK-20251001-0005 resuelto"
 *                       accion_realizada:
 *                         type: string
 *                         example: "Reemplazo del cable de red"
 *                       usuario_responsable:
 *                         type: string
 *                         example: "María Gómez"
 *                       ticket_id:
 *                         type: integer
 *                         example: 27
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total_items:
 *                       type: integer
 *                       example: 15
 *                     items_returned:
 *                       type: integer
 *                       example: 10
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                     has_more:
 *                       type: boolean
 *                       example: true
 *                 filters_applied:
 *                   type: object
 *                   properties:
 *                     tipo_cambio:
 *                       type: string
 *                       nullable: true
 *                       example: "Resolución de ticket"
 *                     fecha_desde:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     fecha_hasta:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: ID inválido
 *       404:
 *         description: No se encontró historial para este equipo
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/historial', verifyToken, historialController.obtenerHistorialEquipo.bind(historialController));

export default router;
