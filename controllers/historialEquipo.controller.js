// controllers/historialEquipo.controller.js
import sql from '../config/db.js'

class HistorialEquipoController {
  async obtenerHistorialEquipo(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de equipo inválido'
        });
      }

      const { tipo_cambio, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;

      const conditions = [sql`he.equipo_id = ${parseInt(id)}`];

      if (tipo_cambio) conditions.push(sql`he.tipo_cambio ILIKE ${'%' + tipo_cambio + '%'}`);
      if (fecha_desde) conditions.push(sql`he.fecha_cambio >= ${fecha_desde}`);
      if (fecha_hasta) conditions.push(sql`he.fecha_cambio <= ${fecha_hasta}`);

      const whereClause = sql.join(conditions, sql` AND `);

      const historial = await sql`
        SELECT 
          he.id,
          he.equipo_id,
          he.tipo_cambio,
          he.estado_anterior_id,
          ea.nombre AS estado_anterior_nombre,
          he.estado_nuevo_id,
          en.nombre AS estado_nuevo_nombre,
          he.usuario_anterior_id,
          ua.nombres || ' ' || ua.apellidos AS usuario_anterior_nombre,
          he.usuario_nuevo_id,
          un.nombres || ' ' || un.apellidos AS usuario_nuevo_nombre,
          he.ubicacion_anterior_id,
          uba.nombre AS ubicacion_anterior_nombre,
          he.ubicacion_nueva_id,
          ubn.nombre AS ubicacion_nueva_nombre,
          he.observaciones,
          he.usuario_responsable_id,
          ur.nombres || ' ' || ur.apellidos AS usuario_responsable_nombre,
          he.fecha_cambio
        FROM public.historial_equipos he
        LEFT JOIN public.estados_equipo ea ON he.estado_anterior_id = ea.id
        LEFT JOIN public.estados_equipo en ON he.estado_nuevo_id = en.id
        LEFT JOIN public.usuarios ua ON he.usuario_anterior_id = ua.id
        LEFT JOIN public.usuarios un ON he.usuario_nuevo_id = un.id
        LEFT JOIN public.ubicaciones uba ON he.ubicacion_anterior_id = uba.id
        LEFT JOIN public.ubicaciones ubn ON he.ubicacion_nueva_id = ubn.id
        LEFT JOIN public.usuarios ur ON he.usuario_responsable_id = ur.id
        WHERE ${whereClause}
        ORDER BY he.fecha_cambio DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const totalResult = await sql`
        SELECT COUNT(*)::int AS total
        FROM public.historial_equipos he
        WHERE ${whereClause}
      `;

      const total = totalResult[0]?.total || 0;

      res.status(200).json({
        success: true,
        data: historial,
        pagination: {
          total_items: total,
          items_returned: historial.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + historial.length) < total
        },
        filters_applied: { tipo_cambio, fecha_desde, fecha_hasta }
      });
    } catch (error) {
      console.error('❌ Error al obtener historial del equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

export default HistorialEquipoController;
