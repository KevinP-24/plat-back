import sql from '../config/db.js'

/**
 * Controlador para el manejo de equipos - CRUD Esencial
 */
class EquipoController {

  /**
   * Crea un nuevo equipo en el inventario
   * RF-05: Registro de Equipos
   * Endpoint: POST /api/equipo
   */
  async crearEquipo(req, res) {
    try {
      const {
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
        observaciones
      } = req.body;

      // 1️⃣ Validaciones básicas
      if (!codigo_inventario || typeof codigo_inventario !== 'string' || codigo_inventario.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El código de inventario es requerido',
          error: 'CODIGO_INVENTARIO_REQUERIDO'
        });
      }

      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del equipo es requerido',
          error: 'NOMBRE_REQUERIDO'
        });
      }

      if (!tipo_equipo_id || isNaN(parseInt(tipo_equipo_id))) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de equipo es requerido y debe ser válido',
          error: 'TIPO_EQUIPO_INVALIDO'
        });
      }

      if (!marca_id || isNaN(parseInt(marca_id))) {
        return res.status(400).json({
          success: false,
          message: 'La marca del equipo es requerida y debe ser válida',
          error: 'MARCA_INVALIDA'
        });
      }

      if (!modelo || typeof modelo !== 'string' || modelo.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El modelo del equipo es requerido',
          error: 'MODELO_REQUERIDO'
        });
      }

      if (valor_compra && (isNaN(parseFloat(valor_compra)) || parseFloat(valor_compra) < 0)) {
        return res.status(400).json({
          success: false,
          message: 'El valor de compra debe ser un número positivo',
          error: 'VALOR_INVALIDO'
        });
      }

      if (fecha_adquisicion && isNaN(Date.parse(fecha_adquisicion))) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de adquisición no es válida',
          error: 'FECHA_ADQUISICION_INVALIDA'
        });
      }

      if (fecha_garantia && isNaN(Date.parse(fecha_garantia))) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de garantía no es válida',
          error: 'FECHA_GARANTIA_INVALIDA'
        });
      }

      if (fecha_adquisicion && fecha_garantia && new Date(fecha_garantia) < new Date(fecha_adquisicion)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de garantía no puede ser anterior a la de adquisición',
          error: 'FECHAS_INVALIDAS'
        });
      }

      // 2️⃣ Verificar autenticación y rol
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      // ⚠️ Comparación insensible a mayúsculas
      if (!req.user.rol_nombre || req.user.rol_nombre.toLowerCase() !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para registrar equipos',
          error: 'PERMISOS_INSUFICIENTES'
        });
      }

      // 3️⃣ Validar unicidad del código de inventario
      const existeCodigo = await sql`
        SELECT id FROM public.equipos WHERE codigo_inventario = ${codigo_inventario.trim()}
      `;
      if (existeCodigo.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un equipo con ese código de inventario',
          error: 'CODIGO_DUPLICADO'
        });
      }

      // 4️⃣ Insertar nuevo equipo
      const nuevoEquipo = await sql`
        INSERT INTO public.equipos (
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
        )
        VALUES (
          ${codigo_inventario.trim()},
          ${nombre.trim()},
          ${descripcion || null},
          ${parseInt(tipo_equipo_id)},
          ${parseInt(marca_id)},
          ${modelo.trim()},
          ${numero_serie || null},
          ${especificaciones ? sql.json(especificaciones) : null},
          ${estado_id ? parseInt(estado_id) : null},
          ${ubicacion_id ? parseInt(ubicacion_id) : null},
          ${usuario_asignado_id ? parseInt(usuario_asignado_id) : null},
          ${fecha_adquisicion || null},
          ${fecha_garantia || null},
          ${valor_compra ? parseFloat(valor_compra) : null},
          ${proveedor || null},
          ${observaciones || null},
          NOW(),
          NOW()
        )
        RETURNING 
          id, codigo_inventario, nombre, descripcion, tipo_equipo_id, marca_id, modelo, numero_serie,
          estado_id, ubicacion_id, usuario_asignado_id, fecha_adquisicion, fecha_garantia, valor_compra,
          proveedor, observaciones, fecha_creacion, fecha_actualizacion
      `;

      const equipo = nuevoEquipo[0];

      // 5️⃣ Log de auditoría
      console.log('✅ Equipo creado exitosamente:', {
        id: equipo.id,
        codigo_inventario: equipo.codigo_inventario,
        creado_por: req.user.id,
        rol: req.user.rol_nombre,
        timestamp: new Date().toISOString()
      });

      // 6️⃣ Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Equipo registrado exitosamente',
        data: equipo
      });

    } catch (error) {
      console.error('❌ Error al crear equipo:', {
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
   * Actualiza la información de un equipo en el inventario
   * RF-06: Actualización de Estado y Datos del Equipo
   * Endpoint: PUT /api/equipo/:id
   */
  async actualizarEquipo(req, res) {
    try {
      const { id } = req.params;

      // 1️⃣ Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de equipo inválido',
          error: 'ID_INVALIDO'
        });
      }

      // 2️⃣ Verificar autenticación y rol
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NO_AUTENTICADO'
        });
      }

      if (!req.user.rol_nombre || req.user.rol_nombre.toLowerCase() !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar equipos',
          error: 'PERMISOS_INSUFICIENTES'
        });
      }

      // 3️⃣ Verificar existencia del equipo
      const equipoExistente = await sql`
        SELECT * FROM public.equipos WHERE id = ${parseInt(id)}
      `;
      if (equipoExistente.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado',
          error: 'EQUIPO_NO_ENCONTRADO'
        });
      }

      // 4️⃣ Definir campos no actualizables por política
      const camposNoActualizables = [
        'id',
        'codigo_inventario',
        'fecha_creacion',
        'fecha_adquisicion',
        'valor_compra',
        'proveedor'
      ];

      for (const campo of camposNoActualizables) {
        if (req.body[campo] !== undefined) {
          return res.status(400).json({
            success: false,
            message: `El campo "${campo}" no puede ser actualizado`,
            error: 'CAMPO_NO_PERMITIDO'
          });
        }
      }

      // 5️⃣ Extraer campos permitidos
      const {
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
        fecha_garantia,
        observaciones
      } = req.body;

      // 6️⃣ Validaciones básicas
      if (nombre && (typeof nombre !== 'string' || nombre.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del equipo no es válido',
          error: 'NOMBRE_INVALIDO'
        });
      }

      if (tipo_equipo_id && isNaN(parseInt(tipo_equipo_id))) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de equipo debe ser un número válido',
          error: 'TIPO_EQUIPO_INVALIDO'
        });
      }

      if (marca_id && isNaN(parseInt(marca_id))) {
        return res.status(400).json({
          success: false,
          message: 'La marca del equipo debe ser un número válido',
          error: 'MARCA_INVALIDA'
        });
      }

      if (fecha_garantia && isNaN(Date.parse(fecha_garantia))) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de garantía no es válida',
          error: 'FECHA_GARANTIA_INVALIDA'
        });
      }

      // 7️⃣ Construir objeto de actualización
      const camposActualizar = {};

      if (nombre !== undefined) camposActualizar.nombre = nombre.trim();
      if (descripcion !== undefined) camposActualizar.descripcion = descripcion || null;
      if (tipo_equipo_id !== undefined) camposActualizar.tipo_equipo_id = parseInt(tipo_equipo_id);
      if (marca_id !== undefined) camposActualizar.marca_id = parseInt(marca_id);
      if (modelo !== undefined) camposActualizar.modelo = modelo.trim();
      if (numero_serie !== undefined) camposActualizar.numero_serie = numero_serie || null;
      if (especificaciones !== undefined) camposActualizar.especificaciones = sql.json(especificaciones);
      if (estado_id !== undefined) camposActualizar.estado_id = parseInt(estado_id);
      if (ubicacion_id !== undefined) camposActualizar.ubicacion_id = parseInt(ubicacion_id);

      // ✅ Corrección clave: permitir null en usuario_asignado_id
      if (usuario_asignado_id !== undefined) {
        camposActualizar.usuario_asignado_id =
          usuario_asignado_id === null ? null : parseInt(usuario_asignado_id);
      }

      if (fecha_garantia !== undefined) camposActualizar.fecha_garantia = fecha_garantia;
      if (observaciones !== undefined) camposActualizar.observaciones = observaciones || null;

      if (Object.keys(camposActualizar).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron campos válidos para actualizar',
          error: 'SIN_DATOS_ACTUALIZACION'
        });
      }

      camposActualizar.fecha_actualizacion = sql`NOW()`;

      console.log('🧩 Campos a actualizar:', camposActualizar);

      // 8️⃣ Ejecutar actualización
      const equipoActualizado = await sql`
        UPDATE public.equipos
        SET ${sql(camposActualizar)}
        WHERE id = ${parseInt(id)}
        RETURNING 
          id, codigo_inventario, nombre, descripcion, tipo_equipo_id, marca_id, modelo,
          numero_serie, especificaciones, estado_id, ubicacion_id, usuario_asignado_id,
          fecha_adquisicion, fecha_garantia, valor_compra, proveedor, observaciones,
          fecha_creacion, fecha_actualizacion
      `;

      // 9️⃣ Auditoría (log interno)
      console.log('🛠️ Equipo actualizado correctamente:', {
        equipo_id: id,
        actualizado_por: req.user.id,
        rol: req.user.rol_nombre,
        campos_modificados: Object.keys(camposActualizar),
        timestamp: new Date().toISOString()
      });

      // 🔟 Respuesta exitosa
      return res.status(200).json({
        success: true,
        message: 'Equipo actualizado exitosamente',
        data: equipoActualizado[0]
      });

    } catch (error) {
      console.error('❌ Error al actualizar equipo:', {
        error: error.message,
        stack: error.stack,
        user_id: req.user?.id,
        timestamp: new Date().toISOString()
      });

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