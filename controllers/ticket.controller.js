import sql from '../config/db.js'

/**
 * Controlador para el manejo de tickets - CRUD Esencial
 */
class TicketsController {
  
  /**
   * Crea un nuevo ticket de soporte técnico
   * RF-01: Registro de Tickets
   * Endpoint: POST /api/tickets
   */
  async crearTicket(req, res) {
    try {
      const { 
        titulo,
        descripcion, 
        categoria_id,
        prioridad_id,
        equipo_afectado_id // opcional
      } = req.body;

      // Validaciones requeridas
      if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El título es requerido',
          error: 'TITULO_REQUERIDO'
        });
      }

      if (titulo.trim().length > 255) {
        return res.status(400).json({
          success: false,
          message: 'El título no puede exceder 255 caracteres',
          error: 'TITULO_MUY_LARGO'
        });
      }

      if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La descripción del problema es requerida',
          error: 'DESCRIPCION_REQUERIDA'
        });
      }

      if (descripcion.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'La descripción debe tener al menos 10 caracteres',
          error: 'DESCRIPCION_MUY_CORTA'
        });
      }

      if (!categoria_id || isNaN(parseInt(categoria_id))) {
        return res.status(400).json({
          success: false,
          message: 'La categoría es requerida y debe ser válida',
          error: 'CATEGORIA_INVALIDA'
        });
      }

      if (!prioridad_id || isNaN(parseInt(prioridad_id))) {
        return res.status(400).json({
          success: false,
          message: 'La prioridad es requerida y debe ser válida',
          error: 'PRIORIDAD_INVALIDA'
        });
      }

      // Obtener el usuario autenticado (debe venir del middleware de autenticación)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_solicitante_id = req.user.id;

      // Verificar que la categoría existe y está activa
      const categoriaExiste = await sql`
        SELECT id, nombre FROM public.categorias_tickets 
        WHERE id = ${parseInt(categoria_id)} AND activo = true
      `;

      if (categoriaExiste.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La categoría especificada no existe o no está activa',
          error: 'CATEGORIA_NO_ENCONTRADA'
        });
      }

      // Verificar que la prioridad existe y está activa
      const prioridadExiste = await sql`
        SELECT id, nombre FROM public.prioridades_tickets 
        WHERE id = ${parseInt(prioridad_id)} AND activo = true
      `;

      if (prioridadExiste.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La prioridad especificada no existe o no está activa',
          error: 'PRIORIDAD_NO_ENCONTRADA'
        });
      }

      // Verificar equipo afectado si se proporciona
      if (equipo_afectado_id && !isNaN(parseInt(equipo_afectado_id))) {
        const equipoExiste = await sql`
          SELECT id, nombre FROM public.equipos 
          WHERE id = ${parseInt(equipo_afectado_id)} AND activo = true
        `;

        if (equipoExiste.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El equipo especificado no existe o no está activo',
            error: 'EQUIPO_NO_ENCONTRADO'
          });
        }
      }

      // Generar número de ticket único (formato: TICK-YYYYMMDD-NNNN)
      const fechaHoy = new Date();
      const fechaStr = fechaHoy.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Obtener el último número de ticket del día
      const ultimoTicketHoy = await sql`
        SELECT numero_ticket 
        FROM public.tickets 
        WHERE numero_ticket LIKE ${'TICK-' + fechaStr + '-%'}
        ORDER BY numero_ticket DESC 
        LIMIT 1
      `;

      let numeroSecuencial = 1;
      if (ultimoTicketHoy.length > 0) {
        const ultimoNumero = ultimoTicketHoy[0].numero_ticket.split('-')[2];
        numeroSecuencial = parseInt(ultimoNumero) + 1;
      }

      const numero_ticket = `TICK-${fechaStr}-${numeroSecuencial.toString().padStart(4, '0')}`;

      // Obtener el estado inicial (debe ser "Pendiente" o similar)
      const estadoInicial = await sql`
        SELECT id FROM public.estados_tickets 
        WHERE nombre = 'Pendiente' AND activo = true
        LIMIT 1
      `;

      if (estadoInicial.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error de configuración: No se encontró el estado inicial',
          error: 'ESTADO_INICIAL_NO_ENCONTRADO'
        });
      }

      // Crear el ticket
      const nuevoTicket = await sql`
        INSERT INTO public.tickets (
          numero_ticket,
          titulo,
          descripcion,
          categoria_id,
          prioridad_id,
          estado_id,
          usuario_solicitante_id,
          equipo_afectado_id,
          fecha_creacion
        )
        VALUES (
          ${numero_ticket},
          ${titulo.trim()},
          ${descripcion.trim()},
          ${parseInt(categoria_id)},
          ${parseInt(prioridad_id)},
          ${estadoInicial[0].id},
          ${usuario_solicitante_id},
          ${equipo_afectado_id ? parseInt(equipo_afectado_id) : null},
          NOW()
        )
        RETURNING 
          id, 
          numero_ticket,
          titulo,
          descripcion,
          categoria_id,
          prioridad_id,
          estado_id,
          usuario_solicitante_id,
          equipo_afectado_id,
          fecha_creacion
      `;

      const ticket = nuevoTicket[0];

      // Obtener información completa del ticket creado para la respuesta
      const ticketCompleto = await sql`
        SELECT 
          t.id,
          t.numero_ticket,
          t.titulo,
          t.descripcion,
          c.nombre as categoria,
          p.nombre as prioridad,
          p.nivel as prioridad_nivel,
          e.nombre as estado,
          u.nombres || ' ' || u.apellidos as usuario_solicitante,
          u.email as usuario_email,
          eq.nombre as equipo_afectado,
          t.fecha_creacion
        FROM public.tickets t
        LEFT JOIN public.categorias_tickets c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades_tickets p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_tickets e ON t.estado_id = e.id
        LEFT JOIN public.usuarios u ON t.usuario_solicitante_id = u.id
        LEFT JOIN public.equipos eq ON t.equipo_afectado_id = eq.id
        WHERE t.id = ${ticket.id}
      `;

      // Log de la creación exitosa
      console.log('✅ Ticket creado exitosamente:', {
        ticket_id: ticket.id,
        numero_ticket: ticket.numero_ticket,
        usuario_id: usuario_solicitante_id,
        categoria: categoriaExiste[0].nombre,
        prioridad: prioridadExiste[0].nombre,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        data: {
          ticket: ticketCompleto[0],
          siguiente_paso: 'El ticket será asignado automáticamente a un técnico según la prioridad y especialidad'
        }
      });

    } catch (error) {
      console.error('❌ Error al crear ticket:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        user_id: req.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Error de duplicación de datos',
          error: 'DUPLICATE_ERROR'
        });
      }

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida a datos relacionados',
          error: 'FOREIGN_KEY_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

export default TicketsController;