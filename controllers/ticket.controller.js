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
        descripcion
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

      // Obtener el usuario autenticado (debe venir del middleware de autenticación)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_solicitante_id = req.user.id;

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
        SELECT id FROM public.estados_ticket
        WHERE nombre = 'Pendiente' LIMIT 1
      `;

      if (estadoInicial.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error de configuración: No se encontró el estado inicial',
          error: 'ESTADO_INICIAL_NO_ENCONTRADO'
        });
      }

      // Crear el ticket con campos NULL - admin completará todo
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
          tecnico_asignado_id,
          fecha_creacion
        )
        VALUES (
          ${numero_ticket},
          ${titulo.trim()},
          ${descripcion.trim()},
          NULL,
          NULL,
          ${estadoInicial[0].id},
          ${usuario_solicitante_id},
          NULL,
          NULL,
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
          t.fecha_creacion
        FROM public.tickets t
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios u ON t.usuario_solicitante_id = u.id
        WHERE t.id = ${ticket.id}
      `;

      // Log de la creación exitosa
      console.log('✅ Ticket creado exitosamente:', {
        ticket_id: ticket.id,
        numero_ticket: ticket.numero_ticket,
        usuario_id: usuario_solicitante_id,
        requiere_asignacion_admin: true,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        data: {
          ticket: {
            ...ticketCompleto[0],
            // Valores NULL/vacíos que el admin debe completar
            categoria: null,
            prioridad: null, 
            prioridad_nivel: null,
            prioridad_color: null,
            estado_color: '#FFA500', // Naranja para Pendiente
            tecnico_asignado: null,
            tecnico_email: null,
            equipo_afectado: null,
            fecha_asignacion: null,
            fecha_resolucion: null,
            fecha_cierre: null
          },
          siguiente_paso: 'El administrador debe asignar categoría, prioridad, equipo y técnico'
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

/**
   * Obtiene los tickets según el rol del usuario autenticado
   * RF-XX: Consulta de Tickets por Rol
   * Endpoint: GET /api/tickets
   */
  async obtenerTickets(req, res) {
    try {
      // Validar autenticación
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_id = req.user.id;
      const usuario_rol = req.user.rol_nombre || req.user.rol; // Usar rol_nombre del token

      // Validar que el rol esté disponible
      if (!usuario_rol) {
        return res.status(401).json({
          success: false,
          message: 'Información de rol no disponible en el token',
          error: 'ROL_NO_DISPONIBLE'
        });
      }

      // Parámetros de consulta para paginación y filtros
      const {
        page = 1,
        limit = 10,
        estado_id,
        categoria_id,
        prioridad_id,
        fecha_desde,
        fecha_hasta,
        orden = 'fecha_creacion',
        direccion = 'DESC'
      } = req.query;

      // Validar parámetros de paginación
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'El número de página debe ser un entero positivo',
          error: 'PAGINA_INVALIDA'
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'El límite debe ser un entero entre 1 y 100',
          error: 'LIMITE_INVALIDO'
        });
      }

      const offset = (pageNum - 1) * limitNum;

      // Validar parámetros de ordenamiento
      const ordenesPermitidos = [
        'fecha_creacion', 'titulo', 'prioridad_nivel', 'estado', 'numero_ticket'
      ];
      const direccionesPermitidas = ['ASC', 'DESC'];

      if (!ordenesPermitidos.includes(orden)) {
        return res.status(400).json({
          success: false,
          message: 'Campo de ordenamiento no válido',
          error: 'ORDEN_INVALIDO'
        });
      }

      if (!direccionesPermitidas.includes(direccion.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Dirección de ordenamiento no válida',
          error: 'DIRECCION_INVALIDA'
        });
      }

      // Construir filtros según el rol del usuario
      let whereConditions = [];

      // Filtro principal por rol
      switch (usuario_rol.toLowerCase()) {
        case 'usuario_final':
        case 'usuario':
          // Usuario final: solo sus propios tickets
          whereConditions.push(`t.usuario_solicitante_id = ${usuario_id}`);
          break;

        case 'tecnico':
        case 'tecnico_soporte':
        case 'técnico':
          // Técnico: solo tickets asignados a él
          whereConditions.push(`t.tecnico_asignado_id = ${usuario_id}`);
          break;

        case 'administrador':
        case 'admin':
          // Administrador: todos los tickets (sin filtro adicional)
          break;

        default:
          return res.status(403).json({
            success: false,
            message: 'Rol de usuario no reconocido',
            error: 'ROL_INVALIDO'
          });
      }

      // Filtros adicionales opcionales
      if (estado_id && !isNaN(parseInt(estado_id))) {
        whereConditions.push(`t.estado_id = ${parseInt(estado_id)}`);
      }

      if (categoria_id && !isNaN(parseInt(categoria_id))) {
        whereConditions.push(`t.categoria_id = ${parseInt(categoria_id)}`);
      }

      if (prioridad_id && !isNaN(parseInt(prioridad_id))) {
        whereConditions.push(`t.prioridad_id = ${parseInt(prioridad_id)}`);
      }

      if (fecha_desde) {
        whereConditions.push(`t.fecha_creacion >= '${fecha_desde}'`);
      }

      if (fecha_hasta) {
        whereConditions.push(`t.fecha_creacion <= '${fecha_hasta}'`);
      }

      // Construir cláusula WHERE
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Mapear campo de ordenamiento
      let campoOrden;
      switch (orden) {
        case 'prioridad_nivel':
          campoOrden = 'p.nivel';
          break;
        case 'estado':
          campoOrden = 'e.nombre';
          break;
        default:
          campoOrden = `t.${orden}`;
      }

      // Consulta principal con toda la información
      const ticketsQuery = `
        SELECT 
          t.id,
          t.numero_ticket,
          t.titulo,
          t.descripcion,
          c.nombre as categoria,
          p.nombre as prioridad,
          p.nivel as prioridad_nivel,
          e.nombre as estado,
          us.nombres || ' ' || us.apellidos as usuario_solicitante,
          us.email as usuario_email,
          ut.nombres || ' ' || ut.apellidos as tecnico_asignado,
          ut.email as tecnico_email,
          eq.nombre as equipo_afectado,
          t.fecha_creacion,
          t.fecha_asignacion,
          t.fecha_resolucion,
          t.fecha_cierre,
          -- Calcular tiempo transcurrido
          CASE 
            WHEN t.fecha_cierre IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600
            ELSE 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_creacion))/3600
          END as horas_transcurridas
        FROM public.tickets t
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        LEFT JOIN public.usuarios ut ON t.tecnico_asignado_id = ut.id
        LEFT JOIN public.equipos eq ON t.equipo_afectado_id = eq.id
        ${whereClause}
        ORDER BY ${campoOrden} ${direccion.toUpperCase()}
        LIMIT ${limitNum} OFFSET ${offset}
      `;

      // Consulta para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM public.tickets t
        ${whereClause}
      `;

      // Ejecutar ambas consultas
      const [tickets, totalResult] = await Promise.all([
        sql.unsafe(ticketsQuery),
        sql.unsafe(countQuery)
      ]);

      const total = parseInt(totalResult[0].total);
      const totalPages = Math.ceil(total / limitNum);

      // Formatear datos de respuesta
      const ticketsFormateados = tickets.map(ticket => ({
        ...ticket,
        horas_transcurridas: Math.round(ticket.horas_transcurridas * 100) / 100, // 2 decimales
        es_urgente: ticket.prioridad_nivel === 1 && ticket.horas_transcurridas > 24,
        puede_editar: usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin' ||
                     (usuario_rol.toLowerCase() === 'tecnico' && ticket.tecnico_asignado && 
                      usuario_id.toString() === ticket.tecnico_asignado.toString()),
        puede_cerrar: usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin' ||
                     (usuario_rol.toLowerCase() === 'tecnico' && ticket.tecnico_asignado && 
                      usuario_id.toString() === ticket.tecnico_asignado.toString()),
        // Agregar colores por defecto basados en la lógica de negocio
        prioridad_color: ticket.prioridad_nivel === 1 ? '#FF0000' : // Rojo para alta
                        ticket.prioridad_nivel === 2 ? '#FFA500' : // Naranja para media  
                        '#008000', // Verde para baja
        estado_color: ticket.estado === 'Pendiente' ? '#FFA500' : // Naranja
                     ticket.estado === 'En Progreso' ? '#0066CC' : // Azul
                     ticket.estado === 'Resuelto' ? '#008000' : // Verde
                     ticket.estado === 'Cerrado' ? '#808080' : // Gris
                     '#000000' // Negro por defecto
      }));

      // Estadísticas rápidas según el rol
      let estadisticas = {};
      
      if (usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin') {
        const statsQuery = `
          SELECT 
            COUNT(*) as total_tickets,
            COUNT(CASE WHEN e.nombre = 'Pendiente' THEN 1 END) as pendientes,
            COUNT(CASE WHEN e.nombre = 'En Progreso' THEN 1 END) as en_progreso,
            COUNT(CASE WHEN e.nombre = 'Resuelto' THEN 1 END) as resueltos,
            COUNT(CASE WHEN e.nombre = 'Cerrado' THEN 1 END) as cerrados,
            COUNT(CASE WHEN p.nivel = 1 THEN 1 END) as alta_prioridad
          FROM public.tickets t
          LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
          LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
          ${whereClause}
        `;
        
        const statsResult = await sql.unsafe(statsQuery);
        estadisticas = statsResult[0];
      }

      // Log de consulta exitosa
      console.log('✅ Tickets obtenidos exitosamente:', {
        usuario_id: usuario_id,
        rol: usuario_rol,
        total_encontrados: total,
        pagina: pageNum,
        filtros_aplicados: Object.keys(req.query).length,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Tickets obtenidos exitosamente',
        data: {
          tickets: ticketsFormateados,
          pagination: {
            current_page: pageNum,
            total_pages: totalPages,
            total_items: total,
            items_per_page: limitNum,
            has_next: pageNum < totalPages,
            has_prev: pageNum > 1
          },
          filters_applied: {
            rol: usuario_rol,
            estado_id: estado_id || null,
            categoria_id: categoria_id || null,
            prioridad_id: prioridad_id || null,
            fecha_desde: fecha_desde || null,
            fecha_hasta: fecha_hasta || null
          },
          ...(usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin' ? { estadisticas } : {})
        }
      });

    } catch (error) {
      console.error('❌ Error al obtener tickets:', {
        error: error.message,
        stack: error.stack,
        user_id: req.user?.id,
        user_rol: req.user?.rol_nombre || req.user?.rol,
        query_params: req.query,
        timestamp: new Date().toISOString()
      });

      if (error.code === '42703') {
        return res.status(400).json({
          success: false,
          message: 'Campo de consulta inválido',
          error: 'INVALID_COLUMN'
        });
      }

      if (error.code === '22007') {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido',
          error: 'INVALID_DATE_FORMAT'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Cambia el estado de un ticket existente
   * RF-XX: Actualización de Estado de Tickets
   * Endpoint: PATCH /api/tickets/:id/estado
   * Permisos: Solo Técnico asignado y Administradores
   */
  async cambiarEstadoTicket(req, res) {
    try {
      // Validar autenticación
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_id = req.user.id;
      const usuario_rol = req.user.rol_nombre || req.user.rol;
      const ticket_id = req.params.id;

      // Validar que el rol esté disponible
      if (!usuario_rol) {
        return res.status(401).json({
          success: false,
          message: 'Información de rol no disponible en el token',
          error: 'ROL_NO_DISPONIBLE'
        });
      }

      // Validar ID del ticket
      if (!ticket_id || isNaN(parseInt(ticket_id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de ticket inválido',
          error: 'TICKET_ID_INVALIDO'
        });
      }

      const { 
        nuevo_estado_id, 
        comentario_tecnico = null,
        motivo_cambio = null 
      } = req.body;

      // Validar datos de entrada
      if (!nuevo_estado_id || isNaN(parseInt(nuevo_estado_id))) {
        return res.status(400).json({
          success: false,
          message: 'El nuevo estado es requerido y debe ser válido',
          error: 'ESTADO_REQUERIDO'
        });
      }

      // Verificar que el usuario tiene permisos para cambiar estados
      if (usuario_rol.toLowerCase() === 'usuario' || usuario_rol.toLowerCase() === 'usuario_final') {
        return res.status(403).json({
          success: false,
          message: 'Los usuarios finales no pueden cambiar el estado de tickets',
          error: 'PERMISOS_INSUFICIENTES'
        });
      }

      // Obtener información actual del ticket
      const ticketActual = await sql`
        SELECT 
          t.id,
          t.numero_ticket,
          t.titulo,
          t.estado_id,
          t.tecnico_asignado_id,
          t.usuario_solicitante_id,
          e.nombre as estado_actual,
          us.nombres || ' ' || us.apellidos as usuario_solicitante,
          ut.nombres || ' ' || ut.apellidos as tecnico_asignado
        FROM public.tickets t
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        LEFT JOIN public.usuarios ut ON t.tecnico_asignado_id = ut.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      if (ticketActual.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
          error: 'TICKET_NO_ENCONTRADO'
        });
      }

      const ticket = ticketActual[0];

      // Validar permisos específicos por rol
      if (usuario_rol.toLowerCase() === 'tecnico' || usuario_rol.toLowerCase() === 'tecnico_soporte') {
        // Técnico solo puede cambiar estado de tickets asignados a él
        if (!ticket.tecnico_asignado_id || ticket.tecnico_asignado_id !== usuario_id) {
          return res.status(403).json({
            success: false,
            message: 'Solo puedes cambiar el estado de tickets asignados a ti',
            error: 'TICKET_NO_ASIGNADO'
          });
        }
      }

      // Verificar que el nuevo estado existe
      const estadoNuevo = await sql`
        SELECT id, nombre FROM public.estados_ticket
        WHERE id = ${parseInt(nuevo_estado_id)}
      `;

      if (estadoNuevo.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El estado especificado no existe',
          error: 'ESTADO_NO_ENCONTRADO'
        });
      }

      const nuevoEstado = estadoNuevo[0];

      // Validar que no sea el mismo estado actual
      if (ticket.estado_id === parseInt(nuevo_estado_id)) {
        return res.status(400).json({
          success: false,
          message: `El ticket ya se encuentra en estado "${nuevoEstado.nombre}"`,
          error: 'ESTADO_DUPLICADO'
        });
      }

      // Validar transiciones de estado permitidas
      const transicionesPermitidas = {
        'Pendiente': ['En Progreso', 'Cancelado', 'Asignado'],
        'Asignado': ['En Progreso', 'Pendiente', 'Cancelado'],
        'En Progreso': ['Resuelto', 'Pendiente', 'Cancelado'],
        'Resuelto': ['Cerrado', 'En Progreso', 'Cancelado'],
        'Cerrado': ['Reabierto'], // Solo admin puede reabrir
        'Cancelado': ['Pendiente'], // Solo admin puede reactivar
        'Reabierto': ['En Progreso', 'Cancelado']
      };

      const estadosEspecialesAdmin = ['Cancelado', 'Reabierto'];
      
      // Verificar transición válida
      const transicionesValidas = transicionesPermitidas[ticket.estado_actual] || [];
      
      if (!transicionesValidas.includes(nuevoEstado.nombre)) {
        return res.status(400).json({
          success: false,
          message: `No se puede cambiar de "${ticket.estado_actual}" a "${nuevoEstado.nombre}"`,
          error: 'TRANSICION_INVALIDA'
        });
      }

      // Verificar permisos para estados especiales (solo admin)
      if (estadosEspecialesAdmin.includes(nuevoEstado.nombre)) {
        if (usuario_rol.toLowerCase() !== 'administrador' && usuario_rol.toLowerCase() !== 'admin') {
          return res.status(403).json({
            success: false,
            message: `Solo los administradores pueden cambiar tickets a estado "${nuevoEstado.nombre}"`,
            error: 'PERMISOS_ESTADO_ESPECIAL'
          });
        }
      }

      // Verificar si se puede cerrar tickets desde "Cerrado"
      if (ticket.estado_actual === 'Cerrado' && usuario_rol.toLowerCase() !== 'administrador' && usuario_rol.toLowerCase() !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo los administradores pueden modificar tickets cerrados',
          error: 'TICKET_CERRADO'
        });
      }

      // Preparar campos de fecha según el nuevo estado
      let camposActualizacion = {
        estado_id: parseInt(nuevo_estado_id),
        fecha_actualizacion: new Date()
      };

      // Actualizar fechas específicas según el estado
      switch (nuevoEstado.nombre) {
        case 'En Progreso':
          if (!ticket.fecha_asignacion) {
            camposActualizacion.fecha_asignacion = new Date();
          }
          break;
        case 'Resuelto':
          camposActualizacion.fecha_resolucion = new Date();
          break;
        case 'Cerrado':
          camposActualizacion.fecha_cierre = new Date();
          break;
      }

      // Construir query de actualización dinámicamente
      const setClauses = [];
      const valores = [];
      let paramCounter = 1;

      Object.entries(camposActualizacion).forEach(([campo, valor]) => {
        setClauses.push(`${campo} = $${paramCounter}`);
        valores.push(valor);
        paramCounter++;
      });

      valores.push(parseInt(ticket_id));

      // Actualizar el ticket
      const ticketActualizado = await sql.unsafe(`
        UPDATE public.tickets 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, valores);

      // Registrar el cambio en historial (si tienes tabla de historial)
      try {
        await sql`
          INSERT INTO public.historial_tickets (
            ticket_id,
            usuario_id,
            estado_anterior,
            estado_nuevo,
            comentario,
            motivo,
            fecha_cambio
          ) VALUES (
            ${parseInt(ticket_id)},
            ${usuario_id},
            ${ticket.estado_actual},
            ${nuevoEstado.nombre},
            ${comentario_tecnico},
            ${motivo_cambio},
            NOW()
          )
        `;
      } catch (historialError) {
        // Si no existe tabla de historial, continuar sin error
        console.log('ℹ️ Tabla historial_tickets no encontrada, continuando sin registrar historial');
      }

      // Obtener información completa del ticket actualizado
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
          us.nombres || ' ' || us.apellidos as usuario_solicitante,
          us.email as usuario_email,
          ut.nombres || ' ' || ut.apellidos as tecnico_asignado,
          ut.email as tecnico_email,
          eq.nombre as equipo_afectado,
          t.fecha_creacion,
          t.fecha_asignacion,
          t.fecha_resolucion,
          t.fecha_cierre,
          t.fecha_actualizacion,
          -- Calcular tiempo transcurrido
          CASE 
            WHEN t.fecha_cierre IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600
            ELSE 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_creacion))/3600
          END as horas_transcurridas
        FROM public.tickets t
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        LEFT JOIN public.usuarios ut ON t.tecnico_asignado_id = ut.id
        LEFT JOIN public.equipos eq ON t.equipo_afectado_id = eq.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      // Formatear respuesta
      const ticketFormateado = {
        ...ticketCompleto[0],
        horas_transcurridas: Math.round(ticketCompleto[0].horas_transcurridas * 100) / 100,
        es_urgente: ticketCompleto[0].prioridad_nivel === 1 && ticketCompleto[0].horas_transcurridas > 24,
        prioridad_color: ticketCompleto[0].prioridad_nivel === 1 ? '#FF0000' : 
                        ticketCompleto[0].prioridad_nivel === 2 ? '#FFA500' : '#008000',
        estado_color: ticketCompleto[0].estado === 'Pendiente' ? '#FFA500' :
                     ticketCompleto[0].estado === 'En Progreso' ? '#0066CC' :
                     ticketCompleto[0].estado === 'Resuelto' ? '#008000' :
                     ticketCompleto[0].estado === 'Cerrado' ? '#808080' : '#000000'
      };

      // Log del cambio exitoso
      console.log('✅ Estado de ticket cambiado exitosamente:', {
        ticket_id: parseInt(ticket_id),
        numero_ticket: ticket.numero_ticket,
        usuario_id: usuario_id,
        usuario_rol: usuario_rol,
        estado_anterior: ticket.estado_actual,
        estado_nuevo: nuevoEstado.nombre,
        comentario: comentario_tecnico ? 'Sí' : 'No',
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: `Estado del ticket cambiado exitosamente de "${ticket.estado_actual}" a "${nuevoEstado.nombre}"`,
        data: {
          ticket: ticketFormateado,
          cambio_realizado: {
            estado_anterior: ticket.estado_actual,
            estado_nuevo: nuevoEstado.nombre,
            fecha_cambio: camposActualizacion.fecha_actualizacion,
            realizado_por: usuario_rol,
            comentario_incluido: !!comentario_tecnico
          },
          siguiente_paso: nuevoEstado.nombre === 'Resuelto' 
            ? 'El ticket está listo para ser cerrado por un administrador'
            : nuevoEstado.nombre === 'En Progreso'
            ? 'El técnico puede trabajar en la resolución del problema'
            : null
        }
      });

    } catch (error) {
      console.error('❌ Error al cambiar estado del ticket:', {
        error: error.message,
        stack: error.stack,
        ticket_id: req.params.id,
        user_id: req.user?.id,
        user_rol: req.user?.rol_nombre || req.user?.rol,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida en los datos proporcionados',
          error: 'FOREIGN_KEY_ERROR'
        });
      }

      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Conflicto con datos existentes',
          error: 'DUPLICATE_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Asigna un ticket a un técnico y completa información faltante
   * RF-03: Asignación de Tickets
   * Endpoint: PATCH /api/tickets/:id/asignar
   * Permisos: Solo Administradores
   */
  async asignarTicket(req, res) {
    try {
      // Validar autenticación
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_id = req.user.id;
      const usuario_rol = req.user.rol_nombre || req.user.rol;
      const ticket_id = req.params.id;

      // Validar que el rol esté disponible
      if (!usuario_rol) {
        return res.status(401).json({
          success: false,
          message: 'Información de rol no disponible en el token',
          error: 'ROL_NO_DISPONIBLE'
        });
      }

      // Verificar que solo administradores pueden asignar tickets
      if (usuario_rol.toLowerCase() !== 'administrador' && usuario_rol.toLowerCase() !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo los administradores pueden asignar tickets',
          error: 'PERMISOS_INSUFICIENTES'
        });
      }

      // Validar ID del ticket
      if (!ticket_id || isNaN(parseInt(ticket_id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de ticket inválido',
          error: 'TICKET_ID_INVALIDO'
        });
      }

      const { 
        tecnico_id,
        categoria_id = null,
        prioridad_id = null,
        equipo_afectado_id = null,
        comentario_asignacion = null
      } = req.body;

      // Validar que se proporcione al menos el técnico
      if (!tecnico_id || isNaN(parseInt(tecnico_id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID del técnico es requerido y debe ser válido',
          error: 'TECNICO_REQUERIDO'
        });
      }

      // Obtener información actual del ticket
      const ticketActual = await sql`
        SELECT 
          t.id,
          t.numero_ticket,
          t.titulo,
          t.descripcion,
          t.estado_id,
          t.categoria_id,
          t.prioridad_id,
          t.tecnico_asignado_id,
          t.usuario_solicitante_id,
          e.nombre as estado_actual,
          c.nombre as categoria_actual,
          p.nombre as prioridad_actual
        FROM public.tickets t
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      if (ticketActual.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
          error: 'TICKET_NO_ENCONTRADO'
        });
      }

      const ticket = ticketActual[0];

      // Verificar que el ticket esté en estado válido para asignación
      const estadosPermitidos = ['Pendiente', 'Sin Asignar'];
      if (!estadosPermitidos.includes(ticket.estado_actual)) {
        return res.status(400).json({
          success: false,
          message: `No se puede asignar un ticket en estado "${ticket.estado_actual}"`,
          error: 'ESTADO_NO_PERMITE_ASIGNACION'
        });
      }

      // Verificar que el ticket no esté ya asignado a otro técnico
      if (ticket.tecnico_asignado_id && ticket.tecnico_asignado_id !== parseInt(tecnico_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ticket ya está asignado a otro técnico. Use reasignar si desea cambiar la asignación',
          error: 'TICKET_YA_ASIGNADO'
        });
      }

      // Verificar que el técnico existe y tiene rol de técnico
      const tecnicoInfo = await sql`
        SELECT 
          u.id,
          u.nombres,
          u.apellidos,
          u.email,
          r.nombre as rol_nombre
        FROM public.usuarios u
        LEFT JOIN public.roles r ON u.rol_id = r.id
        WHERE u.id = ${parseInt(tecnico_id)} AND u.activo = true
      `;

      if (tecnicoInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El técnico especificado no existe o no está activo',
          error: 'TECNICO_NO_ENCONTRADO'
        });
      }

      const tecnico = tecnicoInfo[0];

      // Verificar que el usuario tenga rol de técnico
      if (tecnico.rol_nombre.toLowerCase() !== 'tecnico' && tecnico.rol_nombre.toLowerCase() !== 'técnico') {
        return res.status(400).json({
          success: false,
          message: 'El usuario especificado no tiene rol de técnico',
          error: 'USUARIO_NO_ES_TECNICO'
        });
      }

      // Validar categoría si se proporciona
      let categoriaFinal = ticket.categoria_id;
      if (categoria_id && !isNaN(parseInt(categoria_id))) {
        const categoriaValida = await sql`
          SELECT id, nombre FROM public.categorias_ticket
          WHERE id = ${parseInt(categoria_id)}
        `;

        if (categoriaValida.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'La categoría especificada no existe',
            error: 'CATEGORIA_NO_ENCONTRADA'
          });
        }
        categoriaFinal = parseInt(categoria_id);
      }

      // Validar prioridad si se proporciona
      let prioridadFinal = ticket.prioridad_id;
      if (prioridad_id && !isNaN(parseInt(prioridad_id))) {
        const prioridadValida = await sql`
          SELECT id, nombre FROM public.prioridades
          WHERE id = ${parseInt(prioridad_id)}
        `;

        if (prioridadValida.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'La prioridad especificada no existe',
            error: 'PRIORIDAD_NO_ENCONTRADA'
          });
        }
        prioridadFinal = parseInt(prioridad_id);
      }

      // Validar equipo si se proporciona
      let equipoFinal = null;
      if (equipo_afectado_id && !isNaN(parseInt(equipo_afectado_id))) {
        const equipoValido = await sql`
          SELECT id, nombre FROM public.equipos
          WHERE id = ${parseInt(equipo_afectado_id)}
        `;

        if (equipoValido.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El equipo especificado no existe',
            error: 'EQUIPO_NO_ENCONTRADO'
          });
        }
        equipoFinal = parseInt(equipo_afectado_id);
      }

      // Obtener estado "Asignado" o crear si no existe
      let estadoAsignado = await sql`
        SELECT id FROM public.estados_ticket
        WHERE nombre = 'Asignado' LIMIT 1
      `;

      if (estadoAsignado.length === 0) {
        // Si no existe "Asignado", usar "En Progreso"
        estadoAsignado = await sql`
          SELECT id FROM public.estados_ticket
          WHERE nombre = 'En Progreso' LIMIT 1
        `;
      }

      if (estadoAsignado.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error de configuración: No se encontró estado de asignación válido',
          error: 'ESTADO_ASIGNACION_NO_ENCONTRADO'
        });
      }

      // Actualizar el ticket con toda la información
      const ticketActualizado = await sql`
        UPDATE public.tickets 
        SET 
          tecnico_asignado_id = ${parseInt(tecnico_id)},
          categoria_id = ${categoriaFinal},
          prioridad_id = ${prioridadFinal},
          equipo_afectado_id = ${equipoFinal},
          estado_id = ${estadoAsignado[0].id},
          fecha_asignacion = NOW(),
          fecha_actualizacion = NOW()
        WHERE id = ${parseInt(ticket_id)}
        RETURNING *
      `;

      // Registrar en historial de cambios (si existe la tabla)
      try {
        await sql`
          INSERT INTO public.historial_tickets (
            ticket_id,
            usuario_id,
            accion,
            descripcion,
            comentario,
            fecha_cambio
          ) VALUES (
            ${parseInt(ticket_id)},
            ${usuario_id},
            'ASIGNACION',
            ${`Ticket asignado a ${tecnico.nombres} ${tecnico.apellidos}`},
            ${comentario_asignacion},
            NOW()
          )
        `;
      } catch (historialError) {
        console.log('ℹ️ Tabla historial_tickets no encontrada, continuando sin registrar historial');
      }

      // Obtener información completa del ticket actualizado
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
          us.nombres || ' ' || us.apellidos as usuario_solicitante,
          us.email as usuario_email,
          ut.nombres || ' ' || ut.apellidos as tecnico_asignado,
          ut.email as tecnico_email,
          eq.nombre as equipo_afectado,
          t.fecha_creacion,
          t.fecha_asignacion,
          t.fecha_resolucion,
          t.fecha_cierre,
          t.fecha_actualizacion,
          -- Calcular tiempo transcurrido
          CASE 
            WHEN t.fecha_cierre IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600
            ELSE 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_creacion))/3600
          END as horas_transcurridas
        FROM public.tickets t
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        LEFT JOIN public.usuarios ut ON t.tecnico_asignado_id = ut.id
        LEFT JOIN public.equipos eq ON t.equipo_afectado_id = eq.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      // Formatear respuesta
      const ticketFormateado = {
        ...ticketCompleto[0],
        horas_transcurridas: Math.round(ticketCompleto[0].horas_transcurridas * 100) / 100,
        es_urgente: ticketCompleto[0].prioridad_nivel === 1 && ticketCompleto[0].horas_transcurridas > 24,
        prioridad_color: ticketCompleto[0].prioridad_nivel === 1 ? '#FF0000' : 
                        ticketCompleto[0].prioridad_nivel === 2 ? '#FFA500' : '#008000',
        estado_color: ticketCompleto[0].estado === 'Asignado' ? '#0066CC' :
                     ticketCompleto[0].estado === 'En Progreso' ? '#0066CC' :
                     ticketCompleto[0].estado === 'Pendiente' ? '#FFA500' : '#000000'
      };

      // Log de asignación exitosa
      console.log('✅ Ticket asignado exitosamente:', {
        ticket_id: parseInt(ticket_id),
        numero_ticket: ticket.numero_ticket,
        tecnico_asignado: `${tecnico.nombres} ${tecnico.apellidos}`,
        tecnico_id: parseInt(tecnico_id),
        admin_asignador: usuario_id,
        categoria_actualizada: categoria_id ? 'Sí' : 'No',
        prioridad_actualizada: prioridad_id ? 'Sí' : 'No',
        equipo_asignado: equipo_afectado_id ? 'Sí' : 'No',
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: `Ticket asignado exitosamente a ${tecnico.nombres} ${tecnico.apellidos}`,
        data: {
          ticket: ticketFormateado,
          asignacion_realizada: {
            tecnico_asignado: {
              id: tecnico.id,
              nombre: `${tecnico.nombres} ${tecnico.apellidos}`,
              email: tecnico.email
            },
            fecha_asignacion: ticketCompleto[0].fecha_asignacion,
            categoria_actualizada: categoria_id ? ticketCompleto[0].categoria : 'No modificada',
            prioridad_actualizada: prioridad_id ? ticketCompleto[0].prioridad : 'No modificada',
            equipo_asignado: equipoFinal ? ticketCompleto[0].equipo_afectado : 'No asignado',
            estado_nuevo: ticketCompleto[0].estado,
            comentario_incluido: !!comentario_asignacion
          },
          siguiente_paso: 'El técnico puede comenzar a trabajar en la resolución del problema'
        }
      });

    } catch (error) {
      console.error('❌ Error al asignar ticket:', {
        error: error.message,
        stack: error.stack,
        ticket_id: req.params.id,
        user_id: req.user?.id,
        user_rol: req.user?.rol_nombre || req.user?.rol,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida en los datos proporcionados',
          error: 'FOREIGN_KEY_ERROR'
        });
      }

      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Conflicto con datos existentes',
          error: 'DUPLICATE_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }


  /**
   * Obtiene un ticket específico por su ID
   * RF-XX: Consulta de Ticket Individual
   * Endpoint: GET /api/tickets/:id
   * Permisos: Usuario solo sus tickets, Técnico solo asignados, Admin todos
   */
  async obtenerTicketPorId(req, res) {
    try {
      // Validar autenticación
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_id = req.user.id;
      const usuario_rol = req.user.rol_nombre || req.user.rol;
      const ticket_id = req.params.id;

      // Validar que el rol esté disponible
      if (!usuario_rol) {
        return res.status(401).json({
          success: false,
          message: 'Información de rol no disponible en el token',
          error: 'ROL_NO_DISPONIBLE'
        });
      }

      // Validar ID del ticket
      if (!ticket_id || isNaN(parseInt(ticket_id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de ticket inválido',
          error: 'TICKET_ID_INVALIDO'
        });
      }

      // Obtener información completa del ticket
      const ticketQuery = await sql`
        SELECT 
          t.id,
          t.numero_ticket,
          t.titulo,
          t.descripcion,
          c.nombre as categoria,
          p.nombre as prioridad,
          p.nivel as prioridad_nivel,
          e.nombre as estado,
          us.nombres || ' ' || us.apellidos as usuario_solicitante,
          us.email as usuario_email,
          us.id as usuario_solicitante_id,
          ut.nombres || ' ' || ut.apellidos as tecnico_asignado,
          ut.email as tecnico_email,
          ut.id as tecnico_asignado_id,
          eq.nombre as equipo_afectado,
          t.fecha_creacion,
          t.fecha_asignacion,
          t.fecha_resolucion,
          t.fecha_cierre,
          t.fecha_actualizacion,
          -- Calcular tiempo transcurrido
          CASE 
            WHEN t.fecha_cierre IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600
            ELSE 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_creacion))/3600
          END as horas_transcurridas,
          -- Calcular tiempo en estado actual
          CASE 
            WHEN t.fecha_actualizacion IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_actualizacion))/3600
            ELSE 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_creacion))/3600
          END as horas_en_estado_actual
        FROM public.tickets t
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        LEFT JOIN public.usuarios ut ON t.tecnico_asignado_id = ut.id
        LEFT JOIN public.equipos eq ON t.equipo_afectado_id = eq.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      if (ticketQuery.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
          error: 'TICKET_NO_ENCONTRADO'
        });
      }

      const ticket = ticketQuery[0];

      // Validar permisos de acceso según el rol
      let tieneAcceso = false;

      switch (usuario_rol.toLowerCase()) {
        case 'usuario_final':
        case 'usuario':
          // Usuario final: solo puede ver sus propios tickets
          tieneAcceso = ticket.usuario_solicitante_id === usuario_id;
          break;

        case 'tecnico':
        case 'tecnico_soporte':
        case 'técnico':
          // Técnico: solo puede ver tickets asignados a él
          tieneAcceso = String(ticket.tecnico_asignado_id) === String(usuario_id);
          break;

        case 'administrador':
        case 'admin':
          // Administrador: puede ver cualquier ticket
          tieneAcceso = true;
          break;

        default:
          tieneAcceso = false;
      }

      if (!tieneAcceso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este ticket',
          error: 'ACCESO_DENEGADO'
        });
      }

      // Obtener historial de cambios si existe la tabla
      let historial = [];
      try {
        historial = await sql`
          SELECT 
            h.accion,
            h.descripcion,
            h.comentario,
            h.fecha_cambio,
            u.nombres || ' ' || u.apellidos as usuario_nombre,
            u.email as usuario_email
          FROM public.historial_tickets h
          LEFT JOIN public.usuarios u ON h.usuario_id = u.id
          WHERE h.ticket_id = ${parseInt(ticket_id)}
          ORDER BY h.fecha_cambio ASC
        `;
      } catch (historialError) {
        // Si no existe tabla de historial, continuar sin historial
        console.log('ℹ️ Tabla historial_tickets no encontrada, continuando sin historial');
      }

      // Calcular estadísticas de tiempo
      const tiempoStats = {
        horas_total: Math.round(ticket.horas_transcurridas * 100) / 100,
        horas_en_estado_actual: Math.round(ticket.horas_en_estado_actual * 100) / 100,
        dias_transcurridos: Math.round((ticket.horas_transcurridas / 24) * 100) / 100,
        es_urgente: ticket.prioridad_nivel === 1 && ticket.horas_transcurridas > 24,
        requiere_atencion: ticket.horas_transcurridas > 72 && !['Cerrado', 'Resuelto'].includes(ticket.estado)
      };

      // Calcular permisos del usuario actual sobre este ticket
      const permisos = {
        puede_editar: usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin' ||
                     (usuario_rol.toLowerCase() === 'usuario' && ticket.usuario_solicitante_id === usuario_id && ticket.estado === 'Pendiente'),
        puede_cambiar_estado: usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin' ||
                             (usuario_rol.toLowerCase() === 'tecnico' && ticket.tecnico_asignado_id === usuario_id),
        puede_asignar: usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin',
        puede_comentar: true, // Todos pueden agregar comentarios
        puede_ver_historial: true // Todos los que pueden ver el ticket pueden ver su historial
      };

      // Formatear ticket con información completa
      const ticketFormateado = {
        ...ticket,
        // Agregar colores automáticos
        prioridad_color: ticket.prioridad_nivel === 1 ? '#FF0000' : 
                        ticket.prioridad_nivel === 2 ? '#FFA500' : 
                        ticket.prioridad_nivel === 3 ? '#008000' : '#000000',
        estado_color: ticket.estado === 'Pendiente' ? '#FFA500' :
                     ticket.estado === 'Asignado' ? '#0066CC' :
                     ticket.estado === 'En Progreso' ? '#0066CC' :
                     ticket.estado === 'Resuelto' ? '#008000' :
                     ticket.estado === 'Cerrado' ? '#808080' :
                     ticket.estado === 'Cancelado' ? '#FF0000' : '#000000',
        
        // Estadísticas de tiempo
        estadisticas_tiempo: tiempoStats,
        
        // Permisos del usuario actual
        permisos_usuario: permisos,
        
        // Estado de completitud del ticket
        ticket_completo: !!(ticket.categoria && ticket.prioridad && ticket.tecnico_asignado),
        
        // Siguiente acción recomendada
        siguiente_accion: ticket.estado === 'Pendiente' && !ticket.tecnico_asignado_id 
          ? 'Pendiente de asignación por administrador'
          : ticket.estado === 'Asignado' 
          ? 'Técnico puede iniciar trabajo'
          : ticket.estado === 'En Progreso'
          ? 'En proceso de resolución'
          : ticket.estado === 'Resuelto'
          ? 'Pendiente de cierre por administrador'
          : ticket.estado === 'Cerrado'
          ? 'Ticket completado'
          : 'Estado indefinido'
      };

      // Preparar respuesta con historial si existe
      const respuestaData = {
        ticket: ticketFormateado,
        rol_usuario: usuario_rol
      };

      // Agregar historial solo si tiene registros
      if (historial.length > 0) {
        respuestaData.historial = historial.map(h => ({
          ...h,
          fecha_cambio_formateada: new Date(h.fecha_cambio).toLocaleString('es-CO', {
            timeZone: 'America/Bogota'
          })
        }));
      }

      // Log de consulta exitosa
      console.log('✅ Ticket consultado exitosamente:', {
        ticket_id: parseInt(ticket_id),
        numero_ticket: ticket.numero_ticket,
        usuario_consulta: usuario_id,
        rol: usuario_rol,
        tiene_historial: historial.length > 0,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Ticket obtenido exitosamente',
        data: respuestaData
      });

    } catch (error) {
      console.error('❌ Error al obtener ticket por ID:', {
        error: error.message,
        stack: error.stack,
        ticket_id: req.params.id,
        user_id: req.user?.id,
        user_rol: req.user?.rol_nombre || req.user?.rol,
        timestamp: new Date().toISOString()
      });

      if (error.code === '42703') {
        return res.status(400).json({
          success: false,
          message: 'Campo de consulta inválido',
          error: 'INVALID_COLUMN'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Actualiza información básica de un ticket existente
   * RF-XX: Actualización de Tickets
   * Endpoint: PUT /api/tickets/:id
   * Permisos: Usuario solo sus tickets en Pendiente, Admin con restricciones por estado
   */
  async actualizarTicket(req, res) {
    try {
      // Validar autenticación
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      const usuario_id = req.user.id;
      const usuario_rol = req.user.rol_nombre || req.user.rol;
      const ticket_id = req.params.id;

      // Validar que el rol esté disponible
      if (!usuario_rol) {
        return res.status(401).json({
          success: false,
          message: 'Información de rol no disponible en el token',
          error: 'ROL_NO_DISPONIBLE'
        });
      }

      // Validar ID del ticket
      if (!ticket_id || isNaN(parseInt(ticket_id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de ticket inválido',
          error: 'TICKET_ID_INVALIDO'
        });
      }

      const { titulo, descripcion } = req.body;

      // Validar que se proporcione al menos un campo para actualizar
      if (!titulo && !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos título o descripción para actualizar',
          error: 'CAMPOS_REQUERIDOS'
        });
      }

      // Validar título si se proporciona
      if (titulo !== undefined) {
        if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El título no puede estar vacío',
            error: 'TITULO_VACIO'
          });
        }

        if (titulo.trim().length > 255) {
          return res.status(400).json({
            success: false,
            message: 'El título no puede exceder 255 caracteres',
            error: 'TITULO_MUY_LARGO'
          });
        }
      }

      // Validar descripción si se proporciona
      if (descripcion !== undefined) {
        if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'La descripción no puede estar vacía',
            error: 'DESCRIPCION_VACIA'
          });
        }

        if (descripcion.trim().length < 10) {
          return res.status(400).json({
            success: false,
            message: 'La descripción debe tener al menos 10 caracteres',
            error: 'DESCRIPCION_MUY_CORTA'
          });
        }
      }

      // Obtener información actual del ticket
      const ticketActual = await sql`
        SELECT 
          t.id,
          t.numero_ticket,
          t.titulo,
          t.descripcion,
          t.estado_id,
          t.usuario_solicitante_id,
          t.tecnico_asignado_id,
          e.nombre as estado_actual,
          us.nombres || ' ' || us.apellidos as usuario_solicitante
        FROM public.tickets t
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      if (ticketActual.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
          error: 'TICKET_NO_ENCONTRADO'
        });
      }

      const ticket = ticketActual[0];

      // Validar permisos según el rol y estado del ticket
      let puedeEditar = false;
      let razonRestriccio = '';

      if (usuario_rol.toLowerCase() === 'administrador' || usuario_rol.toLowerCase() === 'admin') {
        // Admin puede editar, pero con restricciones por estado
        const estadosNoEditables = ['Resuelto', 'Cerrado', 'Cancelado'];
        if (estadosNoEditables.includes(ticket.estado_actual)) {
          razonRestriccio = `No se pueden editar tickets en estado "${ticket.estado_actual}" para mantener integridad de auditoría`;
        } else {
          puedeEditar = true;
        }
      } else if (usuario_rol.toLowerCase() === 'usuario' || usuario_rol.toLowerCase() === 'usuario_final') {
        // Usuario final solo puede editar sus propios tickets en estado Pendiente
        if (ticket.usuario_solicitante_id !== usuario_id) {
          razonRestriccio = 'Solo puedes editar tus propios tickets';
        } else if (ticket.estado_actual !== 'Pendiente') {
          razonRestriccio = `No puedes editar tickets en estado "${ticket.estado_actual}". Solo se pueden editar tickets pendientes`;
        } else {
          puedeEditar = true;
        }
      } else if (usuario_rol.toLowerCase() === 'tecnico' || usuario_rol.toLowerCase() === 'tecnico_soporte') {
        // Técnicos NO pueden editar tickets, solo cambiar estados
        razonRestriccio = 'Los técnicos no pueden editar la información del ticket. Solo pueden cambiar estados';
      } else {
        razonRestriccio = 'Rol no autorizado para editar tickets';
      }

      if (!puedeEditar) {
        return res.status(403).json({
          success: false,
          message: razonRestriccio,
          error: 'EDICION_NO_PERMITIDA'
        });
      }

      // Preparar campos para actualización
      const camposActualizar = {};
      
      if (titulo !== undefined) {
        camposActualizar.titulo = titulo.trim();
      }
      
      if (descripcion !== undefined) {
        camposActualizar.descripcion = descripcion.trim();
      }

      camposActualizar.fecha_actualizacion = new Date();

      // Construir query de actualización dinámicamente
      const setClauses = [];
      const valores = [];
      let paramCounter = 1;

      Object.entries(camposActualizar).forEach(([campo, valor]) => {
        setClauses.push(`${campo} = $${paramCounter}`);
        valores.push(valor);
        paramCounter++;
      });

      valores.push(parseInt(ticket_id));

      // Actualizar el ticket
      const ticketActualizado = await sql.unsafe(`
        UPDATE public.tickets 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, valores);

      // Registrar en historial de cambios (si existe la tabla)
      try {
        const cambiosRealizados = [];
        if (titulo !== undefined && titulo.trim() !== ticket.titulo) {
          cambiosRealizados.push(`Título actualizado`);
        }
        if (descripcion !== undefined && descripcion.trim() !== ticket.descripcion) {
          cambiosRealizados.push(`Descripción actualizada`);
        }

        if (cambiosRealizados.length > 0) {
          await sql`
            INSERT INTO public.historial_tickets (
              ticket_id,
              usuario_id,
              accion,
              descripcion,
              comentario,
              fecha_cambio
            ) VALUES (
              ${parseInt(ticket_id)},
              ${usuario_id},
              'EDICION',
              ${cambiosRealizados.join(', ')},
              ${`Editado por ${usuario_rol}`},
              NOW()
            )
          `;
        }
      } catch (historialError) {
        console.log('ℹ️ Tabla historial_tickets no encontrada, continuando sin registrar historial');
      }

      // Obtener información completa del ticket actualizado
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
          us.nombres || ' ' || us.apellidos as usuario_solicitante,
          us.email as usuario_email,
          ut.nombres || ' ' || ut.apellidos as tecnico_asignado,
          ut.email as tecnico_email,
          eq.nombre as equipo_afectado,
          t.fecha_creacion,
          t.fecha_asignacion,
          t.fecha_resolucion,
          t.fecha_cierre,
          t.fecha_actualizacion,
          -- Calcular tiempo transcurrido
          CASE 
            WHEN t.fecha_cierre IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600
            ELSE 
              EXTRACT(EPOCH FROM (NOW() - t.fecha_creacion))/3600
          END as horas_transcurridas
        FROM public.tickets t
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
        LEFT JOIN public.usuarios us ON t.usuario_solicitante_id = us.id
        LEFT JOIN public.usuarios ut ON t.tecnico_asignado_id = ut.id
        LEFT JOIN public.equipos eq ON t.equipo_afectado_id = eq.id
        WHERE t.id = ${parseInt(ticket_id)}
      `;

      // Formatear respuesta
      const ticketFormateado = {
        ...ticketCompleto[0],
        horas_transcurridas: Math.round(ticketCompleto[0].horas_transcurridas * 100) / 100,
        es_urgente: ticketCompleto[0].prioridad_nivel === 1 && ticketCompleto[0].horas_transcurridas > 24,
        prioridad_color: ticketCompleto[0].prioridad_nivel === 1 ? '#FF0000' : 
                        ticketCompleto[0].prioridad_nivel === 2 ? '#FFA500' : 
                        ticketCompleto[0].prioridad_nivel === 3 ? '#008000' : '#000000',
        estado_color: ticketCompleto[0].estado === 'Pendiente' ? '#FFA500' :
                     ticketCompleto[0].estado === 'Asignado' ? '#0066CC' :
                     ticketCompleto[0].estado === 'En Progreso' ? '#0066CC' :
                     ticketCompleto[0].estado === 'Resuelto' ? '#008000' :
                     ticketCompleto[0].estado === 'Cerrado' ? '#808080' : '#000000'
      };

      // Determinar si necesita avisar al técnico (si está asignado y se hizo cambio significativo)
      const necesitaNotificacionTecnico = ticket.tecnico_asignado_id && 
                                         ['Asignado', 'En Progreso'].includes(ticket.estado_actual) &&
                                         (titulo !== undefined || descripcion !== undefined);

      // Log de actualización exitosa
      console.log('✅ Ticket actualizado exitosamente:', {
        ticket_id: parseInt(ticket_id),
        numero_ticket: ticket.numero_ticket,
        usuario_editor: usuario_id,
        rol_editor: usuario_rol,
        campos_actualizados: Object.keys(camposActualizar).filter(k => k !== 'fecha_actualizacion'),
        estado_actual: ticket.estado_actual,
        notificar_tecnico: necesitaNotificacionTecnico,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Ticket actualizado exitosamente',
        data: {
          ticket: ticketFormateado,
          cambios_realizados: {
            titulo_actualizado: titulo !== undefined,
            descripcion_actualizada: descripcion !== undefined,
            fecha_actualizacion: ticketCompleto[0].fecha_actualizacion,
            editor: `${usuario_rol} (ID: ${usuario_id})`
          },
          avisos: {
            tecnico_notificado: necesitaNotificacionTecnico ? 'El técnico asignado será notificado de los cambios' : null,
            restricciones: ticket.estado_actual !== 'Pendiente' ? 
              'Cambios realizados en ticket en progreso. Verificar impacto con técnico asignado.' : null
          }
        }
      });

    } catch (error) {
      console.error('❌ Error al actualizar ticket:', {
        error: error.message,
        stack: error.stack,
        ticket_id: req.params.id,
        user_id: req.user?.id,
        user_rol: req.user?.rol_nombre || req.user?.rol,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida en los datos proporcionados',
          error: 'FOREIGN_KEY_ERROR'
        });
      }

      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Conflicto con datos existentes',
          error: 'DUPLICATE_ERROR'
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