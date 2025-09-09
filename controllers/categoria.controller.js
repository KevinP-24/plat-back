import sql from '../config/db.js'

/**
 * Controlador para el manejo de categorías - CRUD Esencial
 */
class CategoriaController {
  /**
   * Obtiene todas las categorías
   */
  async obtenerCategorias(req, res) {
    try {
      const { activo, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          id, 
          nombre, 
          descripcion,
          activo,
          fecha_creacion
        FROM public.categorias_ticket
      `;

      if (activo !== undefined) {
        baseQuery = sql`
          ${baseQuery}
          WHERE activo = ${activo === 'true'}
        `;
      }

      const finalQuery = sql`
        ${baseQuery}
        ORDER BY nombre ASC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      const categorias = await finalQuery;

      res.status(200).json({
        success: true,
        data: categorias
      });

    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  async obtenerCategoriaPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      const categorias = await sql`
        SELECT 
          id, 
          nombre, 
          descripcion,
          activo,
          fecha_creacion
        FROM public.categorias_ticket 
        WHERE id = ${parseInt(id)}
      `;

      if (categorias.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: categorias[0]
      });

    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default CategoriaController;