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
        SELECT id, nombre FROM public.categorias_ticket
        WHERE id = ${parseInt(categoria_id)}
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
        SELECT id, nombre FROM public.prioridades
        WHERE id = ${parseInt(prioridad_id)}
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
          WHERE id = ${parseInt(equipo_afectado_id)}
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
        LEFT JOIN public.categorias_ticket c ON t.categoria_id = c.id
        LEFT JOIN public.prioridades p ON t.prioridad_id = p.id
        LEFT JOIN public.estados_ticket e ON t.estado_id = e.id
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
}

export default TicketsController;