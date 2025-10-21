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
 *       - Cambios de estado
 *       - Asignaciones de usuario
 *       - Cambios de ubicación
 *       - Observaciones o mantenimientos registrados
 *       
 *       Incluye los **nombres y correos asociados a cada ID** (usuarios, estados y ubicaciones).  
 *       Solo accesible para usuarios autenticados.
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
 *         description: Filtrar por tipo de cambio (por ejemplo, "Asignación de usuario" o "Mantenimiento")
 *         example: "Cambio de usuario"
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
 *         description: Historial del equipo obtenido exitosamente
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
 *                       tipo_cambio:
 *                         type: string
 *                         example: "Cambio de usuario"
 *                       estado_anterior_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "En Reparación"
 *                       estado_nuevo_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "Operativo"
 *                       usuario_anterior_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "Carlos Gómez"
 *                       usuario_anterior_email:
 *                         type: string
 *                         nullable: true
 *                         example: "carlos.gomez@epa.gov.co"
 *                       usuario_nuevo_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "Juan Pérez"
 *                       usuario_nuevo_email:
 *                         type: string
 *                         nullable: true
 *                         example: "juan.perez@epa.gov.co"
 *                       ubicacion_anterior_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "Oficina 202"
 *                       ubicacion_nueva_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "Oficina 305"
 *                       observaciones:
 *                         type: string
 *                         nullable: true
 *                         example: "Equipo trasladado por solicitud del usuario"
 *                       usuario_responsable_nombre:
 *                         type: string
 *                         nullable: true
 *                         example: "Administrador TIC"
 *                       usuario_responsable_email:
 *                         type: string
 *                         nullable: true
 *                         example: "admin@epa.gov.co"
 *                       fecha_cambio:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-20T16:35:00Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total_items:
 *                       type: integer
 *                       example: 25
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
 *                       example: "Cambio de usuario"
 *                     fecha_desde:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     fecha_hasta:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: ID de equipo inválido
 *       404:
 *         description: No se encontró historial para este equipo
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/historial', verifyToken, historialController.obtenerHistorialEquipo.bind(historialController));

export default router;
