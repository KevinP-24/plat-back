import sql from '../config/db.js'

/**
 * Controlador para el manejo de equipos - CRUD Esencial
 */
class EquipoController {
  /**
   * Obtiene todos los equipos
   */
  async obtenerEquipos(req, res) {
    try {
      const { estado_id, tipo_equipo_id, usuario_asignado_id, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          id, 
          codigo_inventario,
          nombre,
          descripcion,
          tipo_equipo_id,
          marca_id,
          modelo,
          numero_serie,
          especificaciones,
          estado_id,
          ubicacion_id,
          usuario_asignado_id,
          fecha_adquisicion,
          fecha_garantia,
          valor_compra,
          proveedor,
          observaciones,
          fecha_creacion,
          fecha_actualizacion
        FROM public.equipos
      `;

      const conditions = [];
      if (estado_id !== undefined) {
        conditions.push(sql`estado_id = ${parseInt(estado_id)}`);
      }
      if (tipo_equipo_id !== undefined) {
        conditions.push(sql`tipo_equipo_id = ${parseInt(tipo_equipo_id)}`);
      }
      if (usuario_asignado_id !== undefined) {
        conditions.push(sql`usuario_asignado_id = ${parseInt(usuario_asignado_id)}`);
      }

      if (conditions.length > 0) {
        baseQuery = sql`
          ${baseQuery}
          WHERE ${sql.join(conditions, sql` AND `)}
        `;
      }

      const finalQuery = sql`
        ${baseQuery}
        ORDER BY codigo_inventario ASC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      const equipos = await finalQuery;

      res.status(200).json({
        success: true,
        data: equipos
      });

    } catch (error) {
      console.error('Error al obtener equipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un equipo por ID
   */
  async obtenerEquipoPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de equipo inválido'
        });
      }

      const equipos = await sql`
        SELECT 
          id, 
          codigo_inventario,
          nombre,
          descripcion,
          tipo_equipo_id,
          marca_id,
          modelo,
          numero_serie,
          especificaciones,
          estado_id,
          ubicacion_id,
          usuario_asignado_id,
          fecha_adquisicion,
          fecha_garantia,
          valor_compra,
          proveedor,
          observaciones,
          fecha_creacion,
          fecha_actualizacion
        FROM public.equipos 
        WHERE id = ${parseInt(id)}
      `;

      if (equipos.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: equipos[0]
      });

    } catch (error) {
      console.error('Error al obtener equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default EquipoController;