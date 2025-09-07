/**
 * Controlador para el manejo de roles del sistema
 * 
 * Implementa todas las operaciones CRUD (Create, Read, Update, Delete) para la entidad roles.
 * Utiliza soft delete para mantener integridad referencial en la base de datos.
 * 
 * @author Tu nombre
 * @version 1.0.0
 */

// Importar cliente de base de datos configurado
import sql from '../config/db.js'

/**
 * Controlador para el manejo de roles - CRUD Esencial
 * 
 * Esta clase encapsula todas las operaciones relacionadas con los roles del sistema,
 * incluyendo validaciones, manejo de errores y respuestas HTTP estandarizadas.
 */
class RolesController {
  
  /**
   * Obtiene todos los roles con filtros y paginación opcionales
   * 
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.query - Parámetros de consulta
   * @param {string} req.query.activo - Filtro por estado activo ('true'/'false')
   * @param {number} req.query.limit - Límite de resultados (default: 50)
   * @param {number} req.query.offset - Desplazamiento para paginación (default: 0)
   * @param {Object} res - Objeto response de Express
   * 
   * @returns {Promise<void>} Respuesta JSON con lista de roles
   * 
   * @example
   * GET /api/roles?activo=true&limit=10&offset=0
   */
  async obtenerRoles(req, res) {
    try {
      // Extraer parámetros de consulta con valores por defecto
      const { activo, limit = 50, offset = 0 } = req.query;
      
      // Construir consulta base para obtener todos los campos necesarios
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

      // Aplicar filtro por estado activo si se proporciona
      if (activo !== undefined) {
        baseQuery = sql`
          ${baseQuery}
          WHERE activo = ${activo === 'true'}
        `;
      }

      // Aplicar ordenamiento y paginación a la consulta final
      const finalQuery = sql`
        ${baseQuery}
        ORDER BY fecha_creacion DESC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      // Ejecutar consulta en la base de datos
      const roles = await finalQuery;

      // Enviar respuesta exitosa con los datos obtenidos
      res.status(200).json({
        success: true,
        data: roles
      });

    } catch (error) {
      // Loggear error para debugging y enviar respuesta de error genérica
      console.error('Error al obtener roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un rol específico por su ID
   * 
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de ruta
   * @param {string} req.params.id - ID del rol a buscar
   * @param {Object} res - Objeto response de Express
   * 
   * @returns {Promise<void>} Respuesta JSON con el rol encontrado o error 404
   * 
   * @example
   * GET /api/roles/123
   */
  async obtenerRolPorId(req, res) {
    try {
      // Extraer ID de los parámetros de ruta
      const { id } = req.params;

      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de rol inválido'
        });
      }

      // Buscar el rol por ID en la base de datos
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

      // Verificar si el rol existe
      if (roles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Enviar respuesta exitosa con el rol encontrado
      res.status(200).json({
        success: true,
        data: roles[0]
      });

    } catch (error) {
      // Loggear error y enviar respuesta de error genérica
      console.error('Error al obtener rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crea un nuevo rol en el sistema
   * 
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos del nuevo rol
   * @param {string} req.body.nombre - Nombre del rol (requerido)
   * @param {string} req.body.descripcion - Descripción del rol (opcional)
   * @param {boolean} req.body.activo - Estado activo del rol (default: true)
   * @param {Object} res - Objeto response de Express
   * 
   * @returns {Promise<void>} Respuesta JSON con el rol creado
   * 
   * @example
   * POST /api/roles
   * Body: { "nombre": "Administrador", "descripcion": "Acceso completo", "activo": true }
   */
  async crearRol(req, res) {
    try {
      // Extraer datos del cuerpo de la petición con valor por defecto para activo
      const { nombre, descripcion, activo = true } = req.body;

      // Validar que el nombre sea proporcionado y válido
      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del rol es requerido'
        });
      }

      // Insertar nuevo rol en la base de datos con RETURNING para obtener datos completos
      const nuevosRoles = await sql`
        INSERT INTO public.roles (nombre, descripcion, activo)
        VALUES (${nombre.trim()}, ${descripcion || null}, ${Boolean(activo)})
        RETURNING id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
      `;

      // Enviar respuesta exitosa con el rol creado
      res.status(201).json({
        success: true,
        message: 'Rol creado exitosamente',
        data: nuevosRoles[0]
      });

    } catch (error) {
      console.error('Error al crear rol:', error);
      
      // Manejar error específico de constraint unique (nombre duplicado)
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un rol con ese nombre'
        });
      }

      // Error genérico del servidor
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza un rol existente
   * 
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de ruta
   * @param {string} req.params.id - ID del rol a actualizar
   * @param {Object} req.body - Datos a actualizar
   * @param {string} req.body.nombre - Nuevo nombre del rol (opcional)
   * @param {string} req.body.descripcion - Nueva descripción del rol (opcional)
   * @param {boolean} req.body.activo - Nuevo estado activo del rol (opcional)
   * @param {Object} res - Objeto response de Express
   * 
   * @returns {Promise<void>} Respuesta JSON con el rol actualizado
   * 
   * @example
   * PUT /api/roles/123
   * Body: { "nombre": "Super Admin", "activo": false }
   */
  async actualizarRol(req, res) {
    try {
      // Extraer ID de parámetros y datos del cuerpo
      const { id } = req.params;
      const { nombre, descripcion, activo } = req.body;

      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de rol inválido'
        });
      }

      // Validar que al menos un campo sea proporcionado para actualizar
      if (!nombre && descripcion === undefined && activo === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      // Verificar que el rol existe antes de intentar actualizarlo
      const existeRol = await sql`
        SELECT id FROM public.roles WHERE id = ${parseInt(id)}
      `;
      
      if (existeRol.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Construir objeto de campos a actualizar dinámicamente
      const updateFields = {};
      
      if (nombre !== undefined) updateFields.nombre = nombre.trim();
      if (descripcion !== undefined) updateFields.descripcion = descripcion || null;
      if (activo !== undefined) updateFields.activo = Boolean(activo);
      
      // Siempre actualizar fecha de modificación
      updateFields.fecha_actualizacion = sql`CURRENT_TIMESTAMP`;

      // Ejecutar actualización con RETURNING para obtener datos actualizados
      const rolesActualizados = await sql`
        UPDATE public.roles 
        SET ${sql(updateFields)}
        WHERE id = ${parseInt(id)}
        RETURNING id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
      `;

      // Enviar respuesta exitosa con el rol actualizado
      res.status(200).json({
        success: true,
        message: 'Rol actualizado exitosamente',
        data: rolesActualizados[0]
      });

    } catch (error) {
      console.error('Error al actualizar rol:', error);
      
      // Manejar error específico de constraint unique (nombre duplicado)
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un rol with ese nombre'
        });
      }

      // Error genérico del servidor
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Elimina un rol usando soft delete (marcado como inactivo)
   * 
   * Esta implementación no elimina físicamente el registro de la base de datos,
   * sino que lo marca como inactivo para mantener la integridad referencial
   * con otras tablas que puedan hacer referencia a este rol.
   * 
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de ruta
   * @param {string} req.params.id - ID del rol a eliminar
   * @param {Object} res - Objeto response de Express
   * 
   * @returns {Promise<void>} Respuesta JSON confirmando la eliminación
   * 
   * @example
   * DELETE /api/roles/123
   */
  async eliminarRol(req, res) {
    try {
      // Extraer ID de los parámetros de ruta
      const { id } = req.params;

      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de rol inválido'
        });
      }

      // Verificar que el rol existe antes de intentar eliminarlo
      const existeRol = await sql`
        SELECT id FROM public.roles WHERE id = ${parseInt(id)}
      `;
      
      if (existeRol.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Soft delete - marcar como inactivo y actualizar fecha de modificación
      await sql`
        UPDATE public.roles 
        SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP 
        WHERE id = ${parseInt(id)}
      `;

      // Enviar respuesta exitosa confirmando la eliminación
      res.status(200).json({
        success: true,
        message: 'Rol eliminado exitosamente'
      });

    } catch (error) {
      // Loggear error y enviar respuesta de error genérica
      console.error('Error al eliminar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

// Exportar la clase controladora para uso en las rutas
export default RolesController;