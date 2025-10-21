// routes/historialEquipo.routes.js
import express from 'express';
import HistorialEquipoController from '../controllers/historialEquipo.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();
const historialController = new HistorialEquipoController();

/**
 * @swagger
 * components:
 *   schemas:
 *     HistorialEquipo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 12
 *           description: ID único del registro de historial
 *         equipo_id:
 *           type: integer
 *           example: 5
 *           description: ID del equipo asociado
 *         tipo_cambio:
 *           type: string
 *           example: "Cambio de usuario asignado"
 *           description: Tipo de evento registrado en el historial
 *         estado_anterior_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         estado_anterior_nombre:
 *           type: string
 *           nullable: true
 *           example: "Disponible"
 *         estado_nuevo_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         estado_nuevo_nombre:
 *           type: string
 *           nullable: true
 *           example: "En reparación"
 *         usuario_anterior_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         usuario_anterior_nombre:
 *           type: string
 *           nullable: true
 *           example: "Juan Pérez"
 *         usuario_nuevo_id:
 *           type: integer
 *           nullable: true
 *           example: 7
 *         usuario_nuevo_nombre:
 *           type: string
 *           nullable: true
 *           example: "María Gómez"
 *         ubicacion_anterior_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         ubicacion_anterior_nombre:
 *           type: string
 *           nullable: true
 *           example: "Oficina Central"
 *         ubicacion_nueva_id:
 *           type: integer
 *           nullable: true
 *           example: 5
 *         ubicacion_nueva_nombre:
 *           type: string
 *           nullable: true
 *           example: "Laboratorio TIC"
 *         observaciones:
 *           type: string
 *           nullable: true
 *           example: "Cambio solicitado por mantenimiento programado"
 *         usuario_responsable_id:
 *           type: integer
 *           example: 10
 *         usuario_responsable_nombre:
 *           type: string
 *           example: "Carlos López"
 *         fecha_cambio:
 *           type: string
 *           format: date-time
 *           example: "2025-10-20T14:32:00Z"
 *
 *     HistorialEquipoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HistorialEquipo'
 *         pagination:
 *           type: object
 *           properties:
 *             total_items:
 *               type: integer
 *               example: 25
 *             items_returned:
 *               type: integer
 *               example: 10
 *             limit:
 *               type: integer
 *               example: 10
 *             offset:
 *               type: integer
 *               example: 0
 *             has_more:
 *               type: boolean
 *               example: true
 *         filters_applied:
 *           type: object
 *           properties:
 *             tipo_cambio:
 *               type: string
 *               nullable: true
 *               example: "Cambio de usuario asignado"
 *             fecha_desde:
 *               type: string
 *               nullable: true
 *               example: "2025-01-01"
 *             fecha_hasta:
 *               type: string
 *               nullable: true
 *               example: null
 */

/**
 * @swagger
 * /api/historialEquipo/{id}/historial:
 *   get:
 *     summary: Obtener historial detallado del equipo
 *     description: |
 *       Retorna todos los registros del historial asociados a un equipo, incluyendo información
 *       del estado, usuario, ubicación y responsable antes y después de cada cambio.
 *       
 *       **Ejemplos de eventos registrados:**
 *       - Asignaciones o cambios de usuario
 *       - Actualizaciones de estado del equipo
 *       - Cambios de ubicación
 *       - Mantenimientos o resoluciones de incidencias
 *       
 *       **Requiere autenticación mediante token JWT.**
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
 *         description: Filtrar por tipo de cambio (por ejemplo, "Asignación", "Mantenimiento")
 *         example: "Cambio de estado"
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar registros desde una fecha específica (YYYY-MM-DD)
 *         example: "2025-01-01"
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar registros hasta una fecha específica (YYYY-MM-DD)
 *         example: "2025-12-31"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de registros a devolver
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a omitir para paginación
 *         example: 0
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistorialEquipoResponse'
 *       400:
 *         description: ID del equipo inválido
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "ID de equipo inválido"
 *       404:
 *         description: No se encontró historial para este equipo
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No se encontraron registros de historial para el equipo especificado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Error interno del servidor"
 *               error: "INTERNAL_SERVER_ERROR"
 */
router.get('/:id/historial', verifyToken, historialController.obtenerHistorialEquipo.bind(historialController));

export default router;
