import sql from '../config/db.js'

/**
 * Controlador para el manejo de prioridades - CRUD Esencial
 */
class PrioridadesController {
  /**
   * Obtiene todas las prioridades
   */
  async obtenerPrioridades(req, res) {
    try {
      const { activo, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          id, 
          nombre, 
          nivel,
          color,
          descripcion, 
          activo
        FROM public.prioridades
      `;

      if (activo !== undefined) {
        baseQuery = sql`
          ${baseQuery}
          WHERE activo = ${activo === 'true'}
        `;
      }

      const finalQuery = sql`
        ${baseQuery}
        ORDER BY nivel ASC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      const prioridades = await finalQuery;

      res.status(200).json({
        success: true,
        data: prioridades
      });

    } catch (error) {
      console.error('Error al obtener prioridades:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene una prioridad por ID
   */
  async obtenerPrioridadPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de prioridad inválido'
        });
      }

      const prioridades = await sql`
        SELECT 
          id, 
          nombre, 
          nivel,
          color,
          descripcion, 
          activo
        FROM public.prioridades 
        WHERE id = ${parseInt(id)}
      `;

      if (prioridades.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Prioridad no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: prioridades[0]
      });

    } catch (error) {
      console.error('Error al obtener prioridad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default PrioridadesController;