import express from 'express';
import TicketsController from '../controllers/ticket.controller.js';

const router = express.Router();
const ticketsController = new TicketsController();

/**
* @swagger
 * /api/tickets:
 *   post:
 *     summary: Crear un nuevo ticket de soporte
 *     description: |
 *       Crea un nuevo ticket de soporte técnico. El ticket se genera con un número único automático 
 *       y se asigna el estado inicial "Pendiente". Requiere autenticación de usuario.
 *       
 *       **Proceso automático:**
 *       - Genera número único formato: TICK-YYYYMMDD-NNNN
 *       - Asigna estado inicial "Pendiente"
 *       - Registra fecha/hora de creación
 *       - Valida categorías, prioridades y equipos
 *       
 *       **Categorías disponibles:**
 *       - Hardware: Problemas con equipos físicos
 *       - Software: Incidencias de aplicaciones y sistemas  
 *       - Permisos: Solicitudes de acceso y autorizaciones
 *       
 *       **Niveles de prioridad:**
 *       - Alta (1): Asignación inmediata, problemas críticos
 *       - Media (2): Asignación normal, problemas importantes
 *       - Baja (3): Procesamiento estándar, problemas menores
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketInput'
 *           example:
 *             titulo: "Problema con impresora de oficina"
 *             descripcion: "La impresora HP LaserJet de la oficina 201 no responde cuando se envían documentos para imprimir. El equipo muestra un error intermitente de papel atascado, pero no hay papel visible en las bandejas. El problema comenzó esta mañana y afecta a 5 usuarios del departamento."
 *             categoria_id: 1
 *             prioridad_id: 2
 *             equipo_afectado_id: 15
 *     responses:
 *       201:
 *         description: Ticket creado exitosamente
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
 *                   example: "Ticket creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *                     siguiente_paso:
 *                       type: string
 *                       example: "El ticket será asignado automáticamente a un técnico según la prioridad y especialidad"
 *             example:
 *               success: true
 *               message: "Ticket creado exitosamente"
 *               data:
 *                 ticket:
 *                   id: 123
 *                   numero_ticket: "TICK-20250831-0015"
 *                   titulo: "Problema con impresora de oficina"
 *                   descripcion: "La impresora HP LaserJet de la oficina 201 no responde..."
 *                   categoria: "Hardware"
 *                   prioridad: "Media"
 *                   prioridad_nivel: 2
 *                   estado: "Pendiente"
 *                   usuario_solicitante: "Juan Pérez García"
 *                   usuario_email: "juan.perez@epa.gov.co"
 *                   tecnico_asignado: null
 *                   equipo_afectado: "Impresora HP-001"
 *                   fecha_creacion: "2025-08-31T10:30:00Z"
 *                   fecha_asignacion: null
 *                   fecha_resolucion: null
 *                   fecha_cierre: null
 *                 siguiente_paso: "El ticket será asignado automáticamente a un técnico según la prioridad y especialidad"
 *       400:
 *         description: Datos de entrada inválidos
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
 *             examples:
 *               titulo_requerido:
 *                 summary: Título faltante
 *                 value:
 *                   success: false
 *                   message: "El título es requerido"
 *                   error: "TITULO_REQUERIDO"
 *               descripcion_corta:
 *                 summary: Descripción muy corta
 *                 value:
 *                   success: false
 *                   message: "La descripción debe tener al menos 10 caracteres"
 *                   error: "DESCRIPCION_MUY_CORTA"
 *               categoria_invalida:
 *                 summary: Categoría inválida
 *                 value:
 *                   success: false
 *                   message: "La categoría especificada no existe o no está activa"
 *                   error: "CATEGORIA_NO_ENCONTRADA"
 *               prioridad_invalida:
 *                 summary: Prioridad inválida
 *                 value:
 *                   success: false
 *                   message: "La prioridad especificada no existe o no está activa"
 *                   error: "PRIORIDAD_NO_ENCONTRADA"
 *       401:
 *         description: Usuario no autenticado
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
 *                   example: "Usuario no autenticado"
 *                 error:
 *                   type: string
 *                   example: "NO_AUTENTICADO"
 *       409:
 *         description: Conflicto de datos
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
 *                   example: "Error de duplicación de datos"
 *                 error:
 *                   type: string
 *                   example: "DUPLICATE_ERROR"
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
 *                 error:
 *                   type: string
 *                   example: "INTERNAL_SERVER_ERROR"
 */
router.post('/', ticketsController.crearTicket);

export default router;