// controllers/historialEquipo.controller.js
import sql from '../config/db.js'

/**
 * Controlador para el historial de equipos
 * Permite consultar eventos asociados a un equipo (asignaciones, cambios, resoluciones, etc.)
 */
class HistorialEquipoController {
  /**
   * GET /api/historialEquipo/:id/historial
   * Obtiene todos los registros del historial de un equipo con filtros opcionales.
   */
  async obtenerHistorialEquipo(req, res) {
    try {
      const { id } = req.params;

      // Validación del parámetro
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de equipo inválido'
        });
      }

      const {
        tipo_cambio,
        fecha_desde,
        fecha_hasta,
        limit = 50,
        offset = 0
      } = req.query;

      // Construcción dinámica de filtros
      let baseQuery = sql`
        SELECT 
          he.id,
          he.equipo_id,
          he.tipo_cambio,

          -- Estados
          he.estado_anterior_id,
          ea.nombre AS estado_anterior_nombre,
          he.estado_nuevo_id,
          en.nombre AS estado_nuevo_nombre,

          -- Usuarios
          he.usuario_anterior_id,
          ua.nombres || ' ' || ua.apellidos AS usuario_anterior_nombre,
          ua.email AS usuario_anterior_email,
          
          he.usuario_nuevo_id,
          un.nombres || ' ' || un.apellidos AS usuario_nuevo_nombre,
          un.email AS usuario_nuevo_email,
          
          -- Ubicaciones
          he.ubicacion_anterior_id,
          uba.nombre AS ubicacion_anterior_nombre,
          he.ubicacion_nueva_id,
          ubn.nombre AS ubicacion_nueva_nombre,

          -- Observaciones y responsable
          he.observaciones,
          he.usuario_responsable_id,
          ur.nombres || ' ' || ur.apellidos AS usuario_responsable_nombre,
          ur.email AS usuario_responsable_email,
          he.fecha_cambio

        FROM public.historial_equipos he
        LEFT JOIN public.estados_ticket ea ON he.estado_anterior_id = ea.id
        LEFT JOIN public.estados_ticket en ON he.estado_nuevo_id = en.id
        LEFT JOIN public.usuarios ua ON he.usuario_anterior_id = ua.id
        LEFT JOIN public.usuarios un ON he.usuario_nuevo_id = un.id
        LEFT JOIN public.usuarios ur ON he.usuario_responsable_id = ur.id
        LEFT JOIN public.ubicaciones uba ON he.ubicacion_anterior_id = uba.id
        LEFT JOIN public.ubicaciones ubn ON he.ubicacion_nueva_id = ubn.id
        WHERE he.equipo_id = ${parseInt(id)}
      `;

      const conditions = [];

      if (tipo_cambio) {
        conditions.push(sql`he.tipo_cambio ILIKE ${'%' + tipo_cambio + '%'}`);
      }
      if (fecha_desde) {
        conditions.push(sql`he.fecha_cambio >= ${fecha_desde}`);
      }
      if (fecha_hasta) {
        conditions.push(sql`he.fecha_cambio <= ${fecha_hasta}`);
      }

      if (conditions.length > 0) {
        baseQuery = sql`${baseQuery} AND ${sql.join(conditions, sql` AND `)}`
      }

      // Consulta principal + conteo total
      const finalQuery = sql`
        ${baseQuery}
        ORDER BY he.fecha_cambio DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;

      const countQuery = sql`
        SELECT COUNT(*)::int AS total
        FROM public.historial_equipos he
        WHERE he.equipo_id = ${parseInt(id)}
        ${conditions.length > 0 ? sql` AND ${sql.join(conditions, sql` AND `)}` : sql``}
      `;

      const [historial, countResult] = await Promise.all([finalQuery, countQuery]);
      const total = countResult[0]?.total || 0;

      return res.status(200).json({
        success: true,
        data: historial,
        pagination: {
          total_items: total,
          items_returned: historial.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + historial.length) < total
        },
        filters_applied: {
          tipo_cambio: tipo_cambio || null,
          fecha_desde: fecha_desde || null,
          fecha_hasta: fecha_hasta || null
        }
      });

    } catch (error) {
      console.error('❌ Error al obtener historial del equipo:', {
        message: error.message,
        stack: error.stack,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message || 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Método auxiliar para registrar un evento en historial
   * Puede ser usado desde otros controladores (por ejemplo, ticket o equipo)
   */
  async crearEventoHistorial({
    equipo_id,
    tipo_cambio,
    estado_anterior_id = null,
    estado_nuevo_id = null,
    usuario_anterior_id = null,
    usuario_nuevo_id = null,
    ubicacion_anterior_id = null,
    ubicacion_nueva_id = null,
    observaciones = null,
    usuario_responsable_id = null
  }) {
    if (!equipo_id || !tipo_cambio) {
      throw new Error('equipo_id y tipo_cambio son requeridos');
    }

    try {
      const rows = await sql`
        INSERT INTO public.historial_equipos (
          equipo_id,
          tipo_cambio,
          estado_anterior_id,
          estado_nuevo_id,
          usuario_anterior_id,
          usuario_nuevo_id,
          ubicacion_anterior_id,
          ubicacion_nueva_id,
          observaciones,
          usuario_responsable_id,
          fecha_cambio
        ) VALUES (
          ${parseInt(equipo_id)},
          ${tipo_cambio},
          ${estado_anterior_id},
          ${estado_nuevo_id},
          ${usuario_anterior_id},
          ${usuario_nuevo_id},
          ${ubicacion_anterior_id},
          ${ubicacion_nueva_id},
          ${observaciones},
          ${usuario_responsable_id},
          NOW()
        )
        RETURNING id
      `;

      console.log(`📝 Historial registrado correctamente para equipo ${equipo_id} (${tipo_cambio})`);
      return rows[0];
    } catch (error) {
      console.error('❌ Error al crear evento en historial:', error.message);
      throw error;
    }
  }
}

export default HistorialEquipoController;
