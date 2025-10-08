import sql from '../config/db.js'

/**
 * Controlador para el manejo de estados de ticket - CRUD Esencial
 */
class EstadosTicketController {
  /**
   * Obtiene todos los estados de ticket
   */
  async obtenerEstadosTicket(req, res) {
    try {
      const { activo, es_final, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          id, 
          nombre, 
          descripcion,
          es_final,
          orden, 
          activo
        FROM public.estados_ticket
      `;

      const conditions = [];
      if (activo !== undefined) {
        conditions.push(sql`activo = ${activo === 'true'}`);
      }
      if (es_final !== undefined) {
        conditions.push(sql`es_final = ${es_final === 'true'}`);
      }

      if (conditions.length > 0) {
        // Usamos .reduce() para unir todas las condiciones del array con "AND"
        const whereClause = conditions.reduce((prev, curr) => sql`${prev} AND ${curr}`);
        
        // Añadimos la cláusula WHERE a nuestra consulta base
        baseQuery = sql`${baseQuery} WHERE ${whereClause}`;
      }

      const finalQuery = sql`
        ${baseQuery}
        ORDER BY orden ASC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      const estadosTicket = await finalQuery;

      res.status(200).json({
        success: true,
        data: estadosTicket
      });

    } catch (error) {
      console.error('Error al obtener estados de ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un estado de ticket por ID
   */
  async obtenerEstadoTicketPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de estado de ticket inválido'
        });
      }

      const estadosTicket = await sql`
        SELECT 
          id, 
          nombre, 
          descripcion,
          es_final,
          orden, 
          activo
        FROM public.estados_ticket 
        WHERE id = ${parseInt(id)}
      `;

      if (estadosTicket.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Estado de ticket no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: estadosTicket[0]
      });

    } catch (error) {
      console.error('Error al obtener estado de ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default EstadosTicketController;