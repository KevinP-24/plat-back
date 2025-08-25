import sql from '../config/db.js'

/**
 * Controlador para el manejo de roles - CRUD Esencial
 */
class RolesController {
  /**
   * Obtiene todos los roles
   */
  async obtenerRoles(req, res) {
    try {
      const { activo, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          id, 
          nombre, 
          descripcion, 
          activo,
          fecha_creacion,
          fecha_actualizacion
        FROM public.roles
      `;

      if (activo !== undefined) {
        baseQuery = sql`
          ${baseQuery}
          WHERE activo = ${activo === 'true'}
        `;
      }

      const finalQuery = sql`
        ${baseQuery}
        ORDER BY fecha_creacion DESC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      const roles = await finalQuery;

      res.status(200).json({
        success: true,
        data: roles
      });

    } catch (error) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un rol por ID
   */
  async obtenerRolPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de rol inválido'
        });
      }

      const roles = await sql`
        SELECT 
          id, 
          nombre, 
          descripcion, 
          activo,
          fecha_creacion,
          fecha_actualizacion
        FROM public.roles 
        WHERE id = ${parseInt(id)}
      `;

      if (roles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: roles[0]
      });

    } catch (error) {
      console.error('Error al obtener rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crea un nuevo rol
   */
  async crearRol(req, res) {
    try {
      const { nombre, descripcion, activo = true } = req.body;

      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del rol es requerido'
        });
      }

      const nuevosRoles = await sql`
        INSERT INTO public.roles (nombre, descripcion, activo)
        VALUES (${nombre.trim()}, ${descripcion || null}, ${Boolean(activo)})
        RETURNING id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
      `;

      res.status(201).json({
        success: true,
        message: 'Rol creado exitosamente',
        data: nuevosRoles[0]
      });

    } catch (error) {
      console.error('Error al crear rol:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un rol con ese nombre'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza un rol
   */
  async actualizarRol(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, activo } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de rol inválido'
        });
      }

      if (!nombre && descripcion === undefined && activo === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      // Verificar que existe
      const existeRol = await sql`
        SELECT id FROM public.roles WHERE id = ${parseInt(id)}
      `;
      
      if (existeRol.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Construir actualización dinámica
      const updateFields = {};
      
      if (nombre !== undefined) updateFields.nombre = nombre.trim();
      if (descripcion !== undefined) updateFields.descripcion = descripcion || null;
      if (activo !== undefined) updateFields.activo = Boolean(activo);
      
      updateFields.fecha_actualizacion = sql`CURRENT_TIMESTAMP`;

      const rolesActualizados = await sql`
        UPDATE public.roles 
        SET ${sql(updateFields)}
        WHERE id = ${parseInt(id)}
        RETURNING id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
      `;

      res.status(200).json({
        success: true,
        message: 'Rol actualizado exitosamente',
        data: rolesActualizados[0]
      });

    } catch (error) {
      console.error('Error al actualizar rol:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un rol with ese nombre'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Elimina un rol (soft delete)
   */
  async eliminarRol(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de rol inválido'
        });
      }

      const existeRol = await sql`
        SELECT id FROM public.roles WHERE id = ${parseInt(id)}
      `;
      
      if (existeRol.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Soft delete - marcar como inactivo
      await sql`
        UPDATE public.roles 
        SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP 
        WHERE id = ${parseInt(id)}
      `;

      res.status(200).json({
        success: true,
        message: 'Rol eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default RolesController;