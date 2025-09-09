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
 *       Crea un nuevo ticket de soporte técnico básico. El ticket se genera con un número único automático 
 *       y se asigna el estado inicial "Pendiente". Requiere solo título y descripción del problema.
 *       
 *       **Proceso automático:**
 *       - Genera número único formato: TICK-YYYYMMDD-NNNN
 *       - Asigna estado inicial "Pendiente"
 *       - Registra fecha/hora de creación
 *       - Campos como categoría, prioridad, equipo y técnico quedan como NULL
 *       
 *       **Siguiente paso:**
 *       El administrador debe usar el endpoint de asignación para completar la información 
 *       faltante (categoría, prioridad, equipo) y asignar el ticket a un técnico.
 *       
 *       **Solo requiere:**
 *       - Título del problema (1-255 caracteres)
 *       - Descripción detallada (mínimo 10 caracteres)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Título descriptivo del problema
 *                 example: "Problema con impresora de oficina"
 *               descripcion:
 *                 type: string
 *                 minLength: 10
 *                 description: Descripción detallada del problema o incidencia
 *                 example: "La impresora HP LaserJet de la oficina 201 no responde cuando se envían documentos para imprimir. El equipo muestra un error intermitente de papel atascado, pero no hay papel visible en las bandejas. El problema comenzó esta mañana y afecta a 5 usuarios del departamento."
 *           examples:
 *             problema_hardware:
 *               summary: Problema de Hardware
 *               value:
 *                 titulo: "Problema con impresora de oficina"
 *                 descripcion: "La impresora HP LaserJet de la oficina 201 no responde cuando se envían documentos para imprimir. El equipo muestra un error intermitente de papel atascado."
 *             problema_software:
 *               summary: Problema de Software
 *               value:
 *                 titulo: "Error en sistema de inventario"
 *                 descripcion: "El sistema de inventario no permite guardar los cambios realizados en los registros. Aparece el mensaje 'Error de conexión' cada vez que intento actualizar los datos."
 *             solicitud_permisos:
 *               summary: Solicitud de Permisos
 *               value:
 *                 titulo: "Solicitud de acceso a carpeta compartida"
 *                 descripcion: "Necesito acceso de lectura y escritura a la carpeta compartida del proyecto Alpha para poder colaborar en los documentos del equipo de desarrollo."
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
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 123
 *                         numero_ticket:
 *                           type: string
 *                           example: "TICK-20250831-0015"
 *                         titulo:
 *                           type: string
 *                           example: "Problema con impresora de oficina"
 *                         descripcion:
 *                           type: string
 *                           example: "La impresora HP LaserJet de la oficina 201 no responde..."
 *                         categoria:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         prioridad:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         prioridad_nivel:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                         prioridad_color:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         estado:
 *                           type: string
 *                           example: "Pendiente"
 *                         estado_color:
 *                           type: string
 *                           example: "#FFA500"
 *                         usuario_solicitante:
 *                           type: string
 *                           example: "Juan Pérez García"
 *                         usuario_email:
 *                           type: string
 *                           example: "juan.perez@epa.gov.co"
 *                         tecnico_asignado:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         tecnico_email:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         equipo_afectado:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-08-31T10:30:00Z"
 *                         fecha_asignacion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         fecha_resolucion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         fecha_cierre:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                     siguiente_paso:
 *                       type: string
 *                       example: "El administrador debe asignar categoría, prioridad, equipo y técnico"
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
 *               titulo_muy_largo:
 *                 summary: Título demasiado largo
 *                 value:
 *                   success: false
 *                   message: "El título no puede exceder 255 caracteres"
 *                   error: "TITULO_MUY_LARGO"
 *               descripcion_requerida:
 *                 summary: Descripción faltante
 *                 value:
 *                   success: false
 *                   message: "La descripción del problema es requerida"
 *                   error: "DESCRIPCION_REQUERIDA"
 *               descripcion_corta:
 *                 summary: Descripción muy corta
 *                 value:
 *                   success: false
 *                   message: "La descripción debe tener al menos 10 caracteres"
 *                   error: "DESCRIPCION_MUY_CORTA"
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
 *             examples:
 *               estado_inicial_no_encontrado:
 *                 summary: Error de configuración del sistema
 *                 value:
 *                   success: false
 *                   message: "Error de configuración: No se encontró el estado inicial"
 *                   error: "ESTADO_INICIAL_NO_ENCONTRADO"
 *               error_interno:
 *                 summary: Error interno general
 *                 value:
 *                   success: false
 *                   message: "Error interno del servidor"
 *                   error: "INTERNAL_SERVER_ERROR"
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

/**
 * @swagger
 * /api/tickets/{id}/estado:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Cambiar estado de un ticket
 *     description: |
 *       Cambia el estado de un ticket existente según los permisos del usuario:
 *       - **Técnico**: Solo puede cambiar estado de tickets asignados a él
 *       - **Administrador**: Puede cambiar estado de cualquier ticket
 *       - **Usuario Final**: No tiene permisos para cambiar estados
 *       
 *       **Transiciones de estado permitidas:**
 *       - Pendiente → En Progreso, Cancelado, Asignado
 *       - En Progreso → Resuelto, Pendiente, Cancelado
 *       - Resuelto → Cerrado, En Progreso
 *       - Cerrado → Reabierto (solo admin)
 *       - Cancelado → Pendiente (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del ticket a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevo_estado_id
 *             properties:
 *               nuevo_estado_id:
 *                 type: integer
 *                 description: ID del nuevo estado del ticket
 *                 example: 2
 *               comentario_tecnico:
 *                 type: string
 *                 description: Comentario opcional del técnico sobre el cambio
 *                 maxLength: 500
 *                 example: "Problema identificado y solucionado exitosamente"
 *               motivo_cambio:
 *                 type: string
 *                 description: Motivo del cambio de estado
 *                 maxLength: 200
 *                 example: "Resolución completada"
 *           examples:
 *             cambio_a_progreso:
 *               summary: Cambiar a En Progreso
 *               value:
 *                 nuevo_estado_id: 2
 *                 comentario_tecnico: "Iniciando trabajo en el problema reportado"
 *                 motivo_cambio: "Ticket asignado y trabajo iniciado"
 *             cambio_a_resuelto:
 *               summary: Cambiar a Resuelto
 *               value:
 *                 nuevo_estado_id: 3
 *                 comentario_tecnico: "Problema solucionado - impresora reparada"
 *                 motivo_cambio: "Resolución exitosa"
 *             cambio_a_cerrado:
 *               summary: Cambiar a Cerrado
 *               value:
 *                 nuevo_estado_id: 4
 *                 motivo_cambio: "Ticket cerrado - usuario confirma solución"
 *     responses:
 *       200:
 *         description: Estado del ticket cambiado exitosamente
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
 *                   example: "Estado del ticket cambiado exitosamente de \"En Progreso\" a \"Resuelto\""
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         numero_ticket:
 *                           type: string
 *                           example: "TICK-20240301-0001"
 *                         titulo:
 *                           type: string
 *                           example: "Problema con impresora"
 *                         descripcion:
 *                           type: string
 *                           example: "La impresora no responde"
 *                         categoria:
 *                           type: string
 *                           example: "Hardware"
 *                         prioridad:
 *                           type: string
 *                           example: "Media"
 *                         prioridad_nivel:
 *                           type: integer
 *                           example: 2
 *                         prioridad_color:
 *                           type: string
 *                           example: "#FFA500"
 *                         estado:
 *                           type: string
 *                           example: "Resuelto"
 *                         estado_color:
 *                           type: string
 *                           example: "#008000"
 *                         usuario_solicitante:
 *                           type: string
 *                           example: "Juan Pérez"
 *                         usuario_email:
 *                           type: string
 *                           example: "juan.perez@epa.gov.co"
 *                         tecnico_asignado:
 *                           type: string
 *                           example: "María García"
 *                         tecnico_email:
 *                           type: string
 *                           example: "maria.garcia@epa.gov.co"
 *                         equipo_afectado:
 *                           type: string
 *                           nullable: true
 *                           example: "Impresora HP LaserJet"
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T08:30:00Z"
 *                         fecha_asignacion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2024-03-01T09:15:00Z"
 *                         fecha_resolucion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2024-03-01T14:30:00Z"
 *                         fecha_cierre:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         fecha_actualizacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:30:00Z"
 *                         horas_transcurridas:
 *                           type: number
 *                           example: 6.0
 *                         es_urgente:
 *                           type: boolean
 *                           example: false
 *                     cambio_realizado:
 *                       type: object
 *                       properties:
 *                         estado_anterior:
 *                           type: string
 *                           example: "En Progreso"
 *                         estado_nuevo:
 *                           type: string
 *                           example: "Resuelto"
 *                         fecha_cambio:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:30:00Z"
 *                         realizado_por:
 *                           type: string
 *                           example: "Tecnico"
 *                         comentario_incluido:
 *                           type: boolean
 *                           example: true
 *                     siguiente_paso:
 *                       type: string
 *                       nullable: true
 *                       example: "El ticket está listo para ser cerrado por un administrador"
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
 *               ticket_id_invalido:
 *                 summary: ID de ticket inválido
 *                 value:
 *                   success: false
 *                   message: "ID de ticket inválido"
 *                   error: "TICKET_ID_INVALIDO"
 *               estado_requerido:
 *                 summary: Estado requerido
 *                 value:
 *                   success: false
 *                   message: "El nuevo estado es requerido y debe ser válido"
 *                   error: "ESTADO_REQUERIDO"
 *               estado_duplicado:
 *                 summary: Estado duplicado
 *                 value:
 *                   success: false
 *                   message: "El ticket ya se encuentra en estado \"Resuelto\""
 *                   error: "ESTADO_DUPLICADO"
 *               transicion_invalida:
 *                 summary: Transición de estado inválida
 *                 value:
 *                   success: false
 *                   message: "No se puede cambiar de \"Cerrado\" a \"En Progreso\""
 *                   error: "TRANSICION_INVALIDA"
 *               estado_no_encontrado:
 *                 summary: Estado no encontrado
 *                 value:
 *                   success: false
 *                   message: "El estado especificado no existe"
 *                   error: "ESTADO_NO_ENCONTRADO"
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
 *         description: Permisos insuficientes
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
 *               usuario_sin_permisos:
 *                 summary: Usuario final sin permisos
 *                 value:
 *                   success: false
 *                   message: "Los usuarios finales no pueden cambiar el estado de tickets"
 *                   error: "PERMISOS_INSUFICIENTES"
 *               ticket_no_asignado:
 *                 summary: Ticket no asignado al técnico
 *                 value:
 *                   success: false
 *                   message: "Solo puedes cambiar el estado de tickets asignados a ti"
 *                   error: "TICKET_NO_ASIGNADO"
 *               estado_especial_admin:
 *                 summary: Estado especial solo para admin
 *                 value:
 *                   success: false
 *                   message: "Solo los administradores pueden cambiar tickets a estado \"Cancelado\""
 *                   error: "PERMISOS_ESTADO_ESPECIAL"
 *               ticket_cerrado:
 *                 summary: Ticket cerrado solo admin puede modificar
 *                 value:
 *                   success: false
 *                   message: "Solo los administradores pueden modificar tickets cerrados"
 *                   error: "TICKET_CERRADO"
 *       404:
 *         description: Ticket no encontrado
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
 *                   example: "Ticket no encontrado"
 *                 error:
 *                   type: string
 *                   example: "TICKET_NO_ENCONTRADO"
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
router.patch('/:id/estado', verifyToken, ticketsController.cambiarEstadoTicket);

/**
 * @swagger
 * /api/tickets/{id}/asignar:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Asignar ticket a técnico y completar información
 *     description: |
 *       Asigna un ticket a un técnico específico y completa la información faltante del ticket.
 *       Este endpoint permite al administrador:
 *       
 *       **Funciones principales:**
 *       - Asignar un técnico al ticket (requerido)
 *       - Completar categoría, prioridad y equipo (opcional)
 *       - Cambiar estado automáticamente a "Asignado" o "En Progreso"
 *       - Establecer fecha de asignación
 *       
 *       **Restricciones:**
 *       - Solo administradores pueden usar este endpoint
 *       - El ticket debe estar en estado "Pendiente" o "Sin Asignar"
 *       - No permite reasignación si ya está asignado a otro técnico
 *       - El técnico debe tener rol activo de técnico
 *       
 *       **Flujo de trabajo:**
 *       1. Usuario crea ticket básico (solo título/descripción)
 *       2. Admin revisa ticket y usa este endpoint para completar información
 *       3. Técnico recibe ticket completo y asignado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del ticket a asignar
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tecnico_id
 *             properties:
 *               tecnico_id:
 *                 type: integer
 *                 description: ID del técnico al que se asignará el ticket
 *                 example: 5
 *               categoria_id:
 *                 type: integer
 *                 description: ID de la categoría del ticket (opcional)
 *                 example: 2
 *               prioridad_id:
 *                 type: integer
 *                 description: ID de la prioridad del ticket (opcional)
 *                 example: 1
 *               equipo_afectado_id:
 *                 type: integer
 *                 description: ID del equipo afectado (opcional)
 *                 example: 15
 *               comentario_asignacion:
 *                 type: string
 *                 description: Comentario opcional sobre la asignación
 *                 maxLength: 500
 *                 example: "Asignado por especialidad en hardware de impresión"
 *           examples:
 *             asignacion_completa:
 *               summary: Asignación con todos los datos
 *               value:
 *                 tecnico_id: 5
 *                 categoria_id: 1
 *                 prioridad_id: 2
 *                 equipo_afectado_id: 15
 *                 comentario_asignacion: "Técnico especialista en hardware de oficina"
 *             asignacion_basica:
 *               summary: Solo asignación de técnico
 *               value:
 *                 tecnico_id: 8
 *                 comentario_asignacion: "Técnico disponible para atender el caso"
 *             asignacion_urgente:
 *               summary: Asignación con alta prioridad
 *               value:
 *                 tecnico_id: 3
 *                 categoria_id: 1
 *                 prioridad_id: 1
 *                 comentario_asignacion: "Ticket urgente - problema crítico de servidor"
 *     responses:
 *       200:
 *         description: Ticket asignado exitosamente
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
 *                   example: "Ticket asignado exitosamente a María García López"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         numero_ticket:
 *                           type: string
 *                           example: "TICK-20240301-0001"
 *                         titulo:
 *                           type: string
 *                           example: "Problema con impresora de oficina"
 *                         descripcion:
 *                           type: string
 *                           example: "La impresora no responde a comandos"
 *                         categoria:
 *                           type: string
 *                           example: "Hardware"
 *                         prioridad:
 *                           type: string
 *                           example: "Media"
 *                         prioridad_nivel:
 *                           type: integer
 *                           example: 2
 *                         prioridad_color:
 *                           type: string
 *                           example: "#FFA500"
 *                         estado:
 *                           type: string
 *                           example: "Asignado"
 *                         estado_color:
 *                           type: string
 *                           example: "#0066CC"
 *                         usuario_solicitante:
 *                           type: string
 *                           example: "Juan Pérez"
 *                         usuario_email:
 *                           type: string
 *                           example: "juan.perez@epa.gov.co"
 *                         tecnico_asignado:
 *                           type: string
 *                           example: "María García López"
 *                         tecnico_email:
 *                           type: string
 *                           example: "maria.garcia@epa.gov.co"
 *                         equipo_afectado:
 *                           type: string
 *                           nullable: true
 *                           example: "Impresora HP LaserJet"
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T08:30:00Z"
 *                         fecha_asignacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:15:00Z"
 *                         fecha_actualizacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:15:00Z"
 *                         horas_transcurridas:
 *                           type: number
 *                           example: 5.75
 *                         es_urgente:
 *                           type: boolean
 *                           example: false
 *                     asignacion_realizada:
 *                       type: object
 *                       properties:
 *                         tecnico_asignado:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 5
 *                             nombre:
 *                               type: string
 *                               example: "María García López"
 *                             email:
 *                               type: string
 *                               example: "maria.garcia@epa.gov.co"
 *                         fecha_asignacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:15:00Z"
 *                         categoria_actualizada:
 *                           type: string
 *                           example: "Hardware"
 *                         prioridad_actualizada:
 *                           type: string
 *                           example: "Media"
 *                         equipo_asignado:
 *                           type: string
 *                           example: "Impresora HP LaserJet"
 *                         estado_nuevo:
 *                           type: string
 *                           example: "Asignado"
 *                         comentario_incluido:
 *                           type: boolean
 *                           example: true
 *                     siguiente_paso:
 *                       type: string
 *                       example: "El técnico puede comenzar a trabajar en la resolución del problema"
 *       400:
 *         description: Datos de entrada inválidos o estado no permite asignación
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
 *               ticket_id_invalido:
 *                 summary: ID de ticket inválido
 *                 value:
 *                   success: false
 *                   message: "ID de ticket inválido"
 *                   error: "TICKET_ID_INVALIDO"
 *               tecnico_requerido:
 *                 summary: Técnico requerido
 *                 value:
 *                   success: false
 *                   message: "El ID del técnico es requerido y debe ser válido"
 *                   error: "TECNICO_REQUERIDO"
 *               estado_no_permite:
 *                 summary: Estado no permite asignación
 *                 value:
 *                   success: false
 *                   message: "No se puede asignar un ticket en estado \"Cerrado\""
 *                   error: "ESTADO_NO_PERMITE_ASIGNACION"
 *               ticket_ya_asignado:
 *                 summary: Ticket ya asignado a otro técnico
 *                 value:
 *                   success: false
 *                   message: "El ticket ya está asignado a otro técnico. Use reasignar si desea cambiar la asignación"
 *                   error: "TICKET_YA_ASIGNADO"
 *               tecnico_no_encontrado:
 *                 summary: Técnico no existe o inactivo
 *                 value:
 *                   success: false
 *                   message: "El técnico especificado no existe o no está activo"
 *                   error: "TECNICO_NO_ENCONTRADO"
 *               usuario_no_es_tecnico:
 *                 summary: Usuario no tiene rol de técnico
 *                 value:
 *                   success: false
 *                   message: "El usuario especificado no tiene rol de técnico"
 *                   error: "USUARIO_NO_ES_TECNICO"
 *               categoria_no_encontrada:
 *                 summary: Categoría no existe
 *                 value:
 *                   success: false
 *                   message: "La categoría especificada no existe"
 *                   error: "CATEGORIA_NO_ENCONTRADA"
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
 *         description: Permisos insuficientes - Solo administradores
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
 *                   example: "Solo los administradores pueden asignar tickets"
 *                 error:
 *                   type: string
 *                   example: "PERMISOS_INSUFICIENTES"
 *       404:
 *         description: Ticket no encontrado
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
 *                   example: "Ticket no encontrado"
 *                 error:
 *                   type: string
 *                   example: "TICKET_NO_ENCONTRADO"
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
router.patch('/:id/asignar', verifyToken, ticketsController.asignarTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener detalles de un ticket específico
 *     description: |
 *       Obtiene información completa y detallada de un ticket específico según los permisos del usuario:
 *       
 *       **Control de acceso por rol:**
 *       - **Usuario Final**: Solo puede ver tickets que él creó
 *       - **Técnico**: Solo puede ver tickets asignados a él
 *       - **Administrador**: Puede ver cualquier ticket del sistema
 *       
 *       **Información incluida:**
 *       - Datos completos del ticket con relaciones
 *       - Estadísticas de tiempo y urgencia
 *       - Historial de cambios (si existe)
 *       - Permisos del usuario actual sobre el ticket
 *       - Estado de completitud y siguiente acción recomendada
 *       - Colores automáticos para UI
 *       
 *       **Casos de uso:**
 *       - Ver detalles completos antes de trabajar en un ticket
 *       - Revisar historial de cambios y comentarios
 *       - Verificar tiempos transcurridos y urgencia
 *       - Determinar qué acciones puede realizar el usuario actual
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID único del ticket a consultar
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Ticket obtenido exitosamente
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
 *                   example: "Ticket obtenido exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         numero_ticket:
 *                           type: string
 *                           example: "TICK-20240301-0001"
 *                         titulo:
 *                           type: string
 *                           example: "Problema con impresora de oficina"
 *                         descripcion:
 *                           type: string
 *                           example: "La impresora HP LaserJet no responde a comandos de impresión"
 *                         categoria:
 *                           type: string
 *                           nullable: true
 *                           example: "Hardware"
 *                         prioridad:
 *                           type: string
 *                           nullable: true
 *                           example: "Alta"
 *                         prioridad_nivel:
 *                           type: integer
 *                           nullable: true
 *                           example: 1
 *                         prioridad_color:
 *                           type: string
 *                           example: "#FF0000"
 *                         estado:
 *                           type: string
 *                           example: "En Progreso"
 *                         estado_color:
 *                           type: string
 *                           example: "#0066CC"
 *                         usuario_solicitante:
 *                           type: string
 *                           example: "Juan Pérez García"
 *                         usuario_email:
 *                           type: string
 *                           example: "juan.perez@epa.gov.co"
 *                         tecnico_asignado:
 *                           type: string
 *                           nullable: true
 *                           example: "María García López"
 *                         tecnico_email:
 *                           type: string
 *                           nullable: true
 *                           example: "maria.garcia@epa.gov.co"
 *                         equipo_afectado:
 *                           type: string
 *                           nullable: true
 *                           example: "Impresora HP LaserJet Pro"
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T08:30:00Z"
 *                         fecha_asignacion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2024-03-01T09:15:00Z"
 *                         fecha_resolucion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         fecha_cierre:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         fecha_actualizacion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2024-03-01T10:30:00Z"
 *                         estadisticas_tiempo:
 *                           type: object
 *                           properties:
 *                             horas_total:
 *                               type: number
 *                               description: Total de horas desde la creación
 *                               example: 26.5
 *                             horas_en_estado_actual:
 *                               type: number
 *                               description: Horas en el estado actual
 *                               example: 1.25
 *                             dias_transcurridos:
 *                               type: number
 *                               description: Días transcurridos desde la creación
 *                               example: 1.1
 *                             es_urgente:
 *                               type: boolean
 *                               description: Si es urgente (alta prioridad + >24h)
 *                               example: true
 *                             requiere_atencion:
 *                               type: boolean
 *                               description: Si requiere atención (>72h sin resolver)
 *                               example: false
 *                         permisos_usuario:
 *                           type: object
 *                           properties:
 *                             puede_editar:
 *                               type: boolean
 *                               description: Si puede editar el ticket
 *                               example: false
 *                             puede_cambiar_estado:
 *                               type: boolean
 *                               description: Si puede cambiar el estado
 *                               example: true
 *                             puede_asignar:
 *                               type: boolean
 *                               description: Si puede asignar técnicos
 *                               example: false
 *                             puede_comentar:
 *                               type: boolean
 *                               description: Si puede agregar comentarios
 *                               example: true
 *                             puede_ver_historial:
 *                               type: boolean
 *                               description: Si puede ver el historial
 *                               example: true
 *                         ticket_completo:
 *                           type: boolean
 *                           description: Si el ticket tiene toda la información necesaria
 *                           example: true
 *                         siguiente_accion:
 *                           type: string
 *                           description: Recomendación de siguiente acción
 *                           example: "En proceso de resolución"
 *                     rol_usuario:
 *                       type: string
 *                       description: Rol del usuario que consulta
 *                       example: "Tecnico"
 *                     historial:
 *                       type: array
 *                       description: Historial de cambios (si existe)
 *                       items:
 *                         type: object
 *                         properties:
 *                           accion:
 *                             type: string
 *                             example: "ASIGNACION"
 *                           descripcion:
 *                             type: string
 *                             example: "Ticket asignado a María García López"
 *                           comentario:
 *                             type: string
 *                             nullable: true
 *                             example: "Técnico especialista en hardware"
 *                           fecha_cambio:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-03-01T09:15:00Z"
 *                           fecha_cambio_formateada:
 *                             type: string
 *                             example: "1/3/2024, 9:15:00 a. m."
 *                           usuario_nombre:
 *                             type: string
 *                             example: "Admin Sistema"
 *                           usuario_email:
 *                             type: string
 *                             example: "admin@epa.gov.co"
 *       400:
 *         description: ID de ticket inválido
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
 *                   example: "ID de ticket inválido"
 *                 error:
 *                   type: string
 *                   example: "TICKET_ID_INVALIDO"
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
 *         description: Sin permisos para ver este ticket
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
 *                   example: "No tienes permisos para ver este ticket"
 *                 error:
 *                   type: string
 *                   example: "ACCESO_DENEGADO"
 *       404:
 *         description: Ticket no encontrado
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
 *                   example: "Ticket no encontrado"
 *                 error:
 *                   type: string
 *                   example: "TICKET_NO_ENCONTRADO"
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
router.get('/:id', verifyToken, ticketsController.obtenerTicketPorId);

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     tags:
 *       - Tickets
 *     summary: Actualizar información básica de un ticket
 *     description: |
 *       Actualiza el título y/o descripción de un ticket existente según los permisos del usuario.
 *       
 *       **Control de acceso por rol y estado:**
 *       - **Usuario Final**: Solo puede editar sus propios tickets en estado "Pendiente"
 *       - **Técnico**: NO puede editar tickets (solo cambiar estados)
 *       - **Administrador**: Puede editar cualquier ticket excepto los que están en estado "Resuelto", "Cerrado" o "Cancelado"
 *       
 *       **Campos editables:**
 *       - Título del ticket (1-255 caracteres)
 *       - Descripción del problema (mínimo 10 caracteres)
 *       - NO se pueden editar: categoría, prioridad, equipo, técnico asignado
 *       
 *       **Restricciones por estado:**
 *       - **Pendiente**: Edición libre para el propietario
 *       - **Asignado/En Progreso**: Solo administradores (con precaución)
 *       - **Resuelto/Cerrado/Cancelado**: NO editable (integridad de auditoría)
 *       
 *       **Casos de uso:**
 *       - Corregir errores en la descripción del problema
 *       - Clarificar o ampliar información del incidente
 *       - Actualizar título para mayor precisión
 *       
 *       **Nota importante:** Si el ticket ya está asignado a un técnico, este será notificado automáticamente de los cambios realizados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID único del ticket a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     requestBody:
 *       required: true
 *       description: Al menos uno de los campos (título o descripción) debe ser proporcionado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Nuevo título para el ticket
 *                 example: "Problema con impresora láser - Error de conexión"
 *               descripcion:
 *                 type: string
 *                 minLength: 10
 *                 description: Nueva descripción detallada del problema
 *                 example: "La impresora HP LaserJet Pro 404dn de la oficina 201 muestra error de conexión de red desde esta mañana. Ya se verificó el cable ethernet y el switch de red, pero el problema persiste. Afecta a 8 usuarios del departamento de contabilidad que no pueden imprimir reportes urgentes."
 *           examples:
 *             solo_titulo:
 *               summary: Actualizar solo el título
 *               value:
 *                 titulo: "Problema de red con impresora láser - Urgente"
 *             solo_descripcion:
 *               summary: Actualizar solo la descripción
 *               value:
 *                 descripcion: "Problema de impresión resuelto parcialmente. La impresora funciona pero muy lenta. Se requiere revisión técnica adicional para optimizar velocidad de impresión."
 *             ambos_campos:
 *               summary: Actualizar título y descripción
 *               value:
 *                 titulo: "Impresora con velocidad reducida - Optimización requerida"
 *                 descripcion: "La impresora HP LaserJet funciona correctamente pero con velocidad muy reducida (5 páginas por minuto vs 25 normal). Se requiere diagnóstico técnico para identificar causa de la lentitud y restaurar velocidad normal."
 *     responses:
 *       200:
 *         description: Ticket actualizado exitosamente
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
 *                   example: "Ticket actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         numero_ticket:
 *                           type: string
 *                           example: "TICK-20240301-0001"
 *                         titulo:
 *                           type: string
 *                           example: "Problema con impresora láser - Error de conexión"
 *                         descripcion:
 *                           type: string
 *                           example: "La impresora HP LaserJet Pro 404dn muestra error de conexión..."
 *                         categoria:
 *                           type: string
 *                           nullable: true
 *                           example: "Hardware"
 *                         prioridad:
 *                           type: string
 *                           nullable: true
 *                           example: "Media"
 *                         prioridad_nivel:
 *                           type: integer
 *                           nullable: true
 *                           example: 2
 *                         prioridad_color:
 *                           type: string
 *                           example: "#FFA500"
 *                         estado:
 *                           type: string
 *                           example: "En Progreso"
 *                         estado_color:
 *                           type: string
 *                           example: "#0066CC"
 *                         usuario_solicitante:
 *                           type: string
 *                           example: "Juan Pérez García"
 *                         usuario_email:
 *                           type: string
 *                           example: "juan.perez@epa.gov.co"
 *                         tecnico_asignado:
 *                           type: string
 *                           nullable: true
 *                           example: "María García López"
 *                         tecnico_email:
 *                           type: string
 *                           nullable: true
 *                           example: "maria.garcia@epa.gov.co"
 *                         equipo_afectado:
 *                           type: string
 *                           nullable: true
 *                           example: "Impresora HP LaserJet Pro"
 *                         fecha_creacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T08:30:00Z"
 *                         fecha_actualizacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:45:00Z"
 *                         horas_transcurridas:
 *                           type: number
 *                           example: 6.25
 *                         es_urgente:
 *                           type: boolean
 *                           example: false
 *                     cambios_realizados:
 *                       type: object
 *                       properties:
 *                         titulo_actualizado:
 *                           type: boolean
 *                           description: Si el título fue actualizado
 *                           example: true
 *                         descripcion_actualizada:
 *                           type: boolean
 *                           description: Si la descripción fue actualizada
 *                           example: false
 *                         fecha_actualizacion:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-03-01T14:45:00Z"
 *                         editor:
 *                           type: string
 *                           description: Información del usuario que realizó la edición
 *                           example: "Usuario (ID: 7)"
 *                     avisos:
 *                       type: object
 *                       properties:
 *                         tecnico_notificado:
 *                           type: string
 *                           nullable: true
 *                           description: Aviso si el técnico será notificado
 *                           example: "El técnico asignado será notificado de los cambios"
 *                         restricciones:
 *                           type: string
 *                           nullable: true
 *                           description: Advertencias sobre restricciones aplicadas
 *                           example: "Cambios realizados en ticket en progreso. Verificar impacto con técnico asignado."
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
 *               ticket_id_invalido:
 *                 summary: ID de ticket inválido
 *                 value:
 *                   success: false
 *                   message: "ID de ticket inválido"
 *                   error: "TICKET_ID_INVALIDO"
 *               campos_requeridos:
 *                 summary: Ningún campo proporcionado
 *                 value:
 *                   success: false
 *                   message: "Debe proporcionar al menos título o descripción para actualizar"
 *                   error: "CAMPOS_REQUERIDOS"
 *               titulo_vacio:
 *                 summary: Título vacío
 *                 value:
 *                   success: false
 *                   message: "El título no puede estar vacío"
 *                   error: "TITULO_VACIO"
 *               titulo_muy_largo:
 *                 summary: Título demasiado largo
 *                 value:
 *                   success: false
 *                   message: "El título no puede exceder 255 caracteres"
 *                   error: "TITULO_MUY_LARGO"
 *               descripcion_muy_corta:
 *                 summary: Descripción muy corta
 *                 value:
 *                   success: false
 *                   message: "La descripción debe tener al menos 10 caracteres"
 *                   error: "DESCRIPCION_MUY_CORTA"
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
 *         description: Sin permisos para editar este ticket
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
 *               no_es_propietario:
 *                 summary: No es propietario del ticket
 *                 value:
 *                   success: false
 *                   message: "Solo puedes editar tus propios tickets"
 *                   error: "EDICION_NO_PERMITIDA"
 *               estado_no_permite:
 *                 summary: Estado no permite edición
 *                 value:
 *                   success: false
 *                   message: "No puedes editar tickets en estado \"Resuelto\". Solo se pueden editar tickets pendientes"
 *                   error: "EDICION_NO_PERMITIDA"
 *               tecnico_sin_permisos:
 *                 summary: Técnico no puede editar
 *                 value:
 *                   success: false
 *                   message: "Los técnicos no pueden editar la información del ticket. Solo pueden cambiar estados"
 *                   error: "EDICION_NO_PERMITIDA"
 *               auditoria_protegida:
 *                 summary: Ticket cerrado protegido
 *                 value:
 *                   success: false
 *                   message: "No se pueden editar tickets en estado \"Cerrado\" para mantener integridad de auditoría"
 *                   error: "EDICION_NO_PERMITIDA"
 *       404:
 *         description: Ticket no encontrado
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
 *                   example: "Ticket no encontrado"
 *                 error:
 *                   type: string
 *                   example: "TICKET_NO_ENCONTRADO"
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
router.put('/:id', verifyToken, ticketsController.actualizarTicket);

export default router;