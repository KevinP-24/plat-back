import express from 'express';
import TicketsController from '../controllers/ticket.controller.js';
import { verifyToken } from '../middlewares/auth.js';

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
router.post('/', verifyToken, ticketsController.crearTicket);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener tickets según rol del usuario
 *     description: |
 *       Obtiene la lista de tickets de soporte filtrada según el rol del usuario autenticado:
 *       - **Usuario Final**: Solo tickets que él creó
 *       - **Técnico**: Solo tickets asignados a él  
 *       - **Administrador**: Todos los tickets del sistema
 *       
 *       Incluye paginación, filtros avanzados y ordenamiento configurable.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número de página para paginación
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Número de elementos por página (máximo 100)
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *       - name: estado_id
 *         in: query
 *         description: Filtrar por ID del estado del ticket
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: categoria_id
 *         in: query
 *         description: Filtrar por ID de la categoría del ticket
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2
 *       - name: prioridad_id
 *         in: query
 *         description: Filtrar por ID de la prioridad del ticket
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: fecha_desde
 *         in: query
 *         description: Filtrar tickets creados desde esta fecha (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - name: fecha_hasta
 *         in: query
 *         description: Filtrar tickets creados hasta esta fecha (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *       - name: orden
 *         in: query
 *         description: Campo por el cual ordenar los resultados
 *         required: false
 *         schema:
 *           type: string
 *           enum: [fecha_creacion, titulo, prioridad_nivel, estado, numero_ticket]
 *           default: fecha_creacion
 *           example: fecha_creacion
 *       - name: direccion
 *         in: query
 *         description: Dirección del ordenamiento
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *           example: DESC
 *     responses:
 *       200:
 *         description: Tickets obtenidos exitosamente
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
 *                   example: "Tickets obtenidos exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           numero_ticket:
 *                             type: string
 *                             example: "TICK-20240301-0001"
 *                           titulo:
 *                             type: string
 *                             example: "Problema con impresora"
 *                           descripcion:
 *                             type: string
 *                             example: "La impresora no responde"
 *                           categoria:
 *                             type: string
 *                             example: "Hardware"
 *                           prioridad:
 *                             type: string
 *                             example: "Media"
 *                           prioridad_nivel:
 *                             type: integer
 *                             example: 2
 *                           prioridad_color:
 *                             type: string
 *                             example: "#FFA500"
 *                           estado:
 *                             type: string
 *                             example: "En Progreso"
 *                           estado_color:
 *                             type: string
 *                             example: "#0066CC"
 *                           usuario_solicitante:
 *                             type: string
 *                             example: "Juan Pérez"
 *                           usuario_email:
 *                             type: string
 *                             example: "juan.perez@epa.gov.co"
 *                           tecnico_asignado:
 *                             type: string
 *                             nullable: true
 *                             example: "María García"
 *                           tecnico_email:
 *                             type: string
 *                             nullable: true
 *                             example: "maria.garcia@epa.gov.co"
 *                           equipo_afectado:
 *                             type: string
 *                             nullable: true
 *                             example: "Impresora HP LaserJet"
 *                           equipo_codigo:
 *                             type: string
 *                             nullable: true
 *                             example: "IMP-001"
 *                           fecha_creacion:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-03-01T08:30:00Z"
 *                           fecha_asignacion:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2024-03-01T09:15:00Z"
 *                           fecha_resolucion:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                           fecha_cierre:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                           horas_transcurridas:
 *                             type: number
 *                             example: 25.5
 *                           es_urgente:
 *                             type: boolean
 *                             example: false
 *                           puede_editar:
 *                             type: boolean
 *                             example: false
 *                           puede_cerrar:
 *                             type: boolean
 *                             example: false
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         total_pages:
 *                           type: integer
 *                           example: 3
 *                         total_items:
 *                           type: integer
 *                           example: 25
 *                         items_per_page:
 *                           type: integer
 *                           example: 10
 *                         has_next:
 *                           type: boolean
 *                           example: true
 *                         has_prev:
 *                           type: boolean
 *                           example: false
 *                     filters_applied:
 *                       type: object
 *                       properties:
 *                         rol:
 *                           type: string
 *                           example: "usuario_final"
 *                         estado_id:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                         categoria_id:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                         prioridad_id:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                         fecha_desde:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         fecha_hasta:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                     estadisticas:
 *                       type: object
 *                       description: "Solo incluido para administradores"
 *                       properties:
 *                         total_tickets:
 *                           type: integer
 *                           example: 50
 *                         pendientes:
 *                           type: integer
 *                           example: 15
 *                         en_progreso:
 *                           type: integer
 *                           example: 20
 *                         resueltos:
 *                           type: integer
 *                           example: 10
 *                         cerrados:
 *                           type: integer
 *                           example: 5
 *                         alta_prioridad:
 *                           type: integer
 *                           example: 8
 *       400:
 *         description: Parámetros de consulta inválidos
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
 *                   example: "El número de página debe ser un entero positivo"
 *                 error:
 *                   type: string
 *                   example: "PAGINA_INVALIDA"
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
 *       403:
 *         description: Rol de usuario no válido
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
 *                   example: "Rol de usuario no reconocido"
 *                 error:
 *                   type: string
 *                   example: "ROL_INVALIDO"
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
router.get('/', verifyToken, ticketsController.obtenerTickets);

export default router;