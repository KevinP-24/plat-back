import sql from '../config/db.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import emailService from '../utils/emailService.js'

/**
 * Controlador para el manejo de usuarios - CRUD Esencial
 */
class UsuariosController {
  /**
   * Obtiene todos los usuarios
   */
  async obtenerUsuarios(req, res) {
    try {
      const { activo, departamento, rol_id, search, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          u.id, 
          u.nombre_usuario,
          u.email,
          u.nombres,
          u.apellidos,
          u.telefono,
          u.departamento,
          u.cargo,
          u.rol_id,
          r.nombre as rol_nombre,
          u.activo,
          u.ultimo_acceso,
          u.fecha_creacion,
          u.fecha_actualizacion
        FROM public.usuarios u
        LEFT JOIN public.roles r ON u.rol_id = r.id
        WHERE 1=1
      `;

      const conditions = [];
      
      if (activo !== undefined) {
        conditions.push(sql`u.activo = ${activo === 'true'}`);
      }

      if (departamento) {
        conditions.push(sql`LOWER(u.departamento) = LOWER(${departamento})`);
      }

      if (rol_id && !isNaN(parseInt(rol_id))) {
        conditions.push(sql`u.rol_id = ${parseInt(rol_id)}`);
      }

      if (search) {
        conditions.push(sql`(
          LOWER(u.nombres) LIKE LOWER(${`%${search}%`}) OR 
          LOWER(u.apellidos) LIKE LOWER(${`%${search}%`}) OR 
          LOWER(u.email) LIKE LOWER(${`%${search}%`}) OR
          LOWER(u.nombre_usuario) LIKE LOWER(${`%${search}%`})
        )`);
      }

      if (conditions.length > 0) {
        for (const condition of conditions) {
          baseQuery = sql`${baseQuery} AND ${condition}`;
        }
      }

      const finalQuery = sql`
        ${baseQuery}
        ORDER BY u.fecha_creacion DESC 
        LIMIT ${parseInt(limit)} 
        OFFSET ${parseInt(offset)}
      `;

      const usuarios = await finalQuery;

      res.status(200).json({
        success: true,
        data: usuarios
      });

    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async obtenerUsuarioPorId(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      const usuarios = await sql`
        SELECT 
          u.id, 
          u.nombre_usuario,
          u.email,
          u.nombres,
          u.apellidos,
          u.telefono,
          u.departamento,
          u.cargo,
          u.rol_id,
          r.nombre as rol_nombre,
          r.descripcion as rol_descripcion,
          u.activo,
          u.ultimo_acceso,
          u.fecha_creacion,
          u.fecha_actualizacion
        FROM public.usuarios u
        LEFT JOIN public.roles r ON u.rol_id = r.id
        WHERE u.id = ${parseInt(id)}
      `;

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: usuarios[0]
      });

    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async crearUsuario(req, res) {
    try {
      const { 
        nombre_usuario, 
        email, 
        nombres, 
        apellidos, 
        telefono,
        departamento,
        cargo,
        rol_id,
        password,
        activo = true 
      } = req.body;

      // Validaciones requeridas
      if (!nombre_usuario || typeof nombre_usuario !== 'string' || nombre_usuario.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario es requerido'
        });
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido y debe ser válido'
        });
      }

      if (!nombres || typeof nombres !== 'string' || nombres.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Los nombres son requeridos'
        });
      }

      if (!apellidos || typeof apellidos !== 'string' || apellidos.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Los apellidos son requeridos'
        });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña es requerida y debe tener al menos 6 caracteres'
        });
      }

      if (!rol_id || isNaN(parseInt(rol_id))) {
        return res.status(400).json({
          success: false,
          message: 'El rol es requerido y debe ser válido'
        });
      }

      // Verificar que el rol existe y está activo
      const rolExiste = await sql`
        SELECT id FROM public.roles WHERE id = ${parseInt(rol_id)} AND activo = true
      `;

      if (rolExiste.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El rol especificado no existe o no está activo'
        });
      }

      // Verificar unicidad de nombre_usuario
      const usuarioExiste = await sql`
        SELECT id FROM public.usuarios WHERE nombre_usuario = ${nombre_usuario.trim()}
      `;

      if (usuarioExiste.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con ese nombre de usuario'
        });
      }

      // Verificar unicidad de email
      const emailExiste = await sql`
        SELECT id FROM public.usuarios WHERE email = ${email.trim().toLowerCase()}
      `;

      if (emailExiste.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con ese email'
        });
      }

      // Encriptar contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const nuevosUsuarios = await sql`
        INSERT INTO public.usuarios (
          nombre_usuario, 
          email, 
          nombres, 
          apellidos, 
          telefono,
          departamento,
          cargo,
          rol_id,
          password,
          activo
        )
        VALUES (
          ${nombre_usuario.trim()}, 
          ${email.trim().toLowerCase()}, 
          ${nombres.trim()}, 
          ${apellidos.trim()}, 
          ${telefono || null},
          ${departamento || null},
          ${cargo || null},
          ${parseInt(rol_id)},
          ${hashedPassword},
          ${Boolean(activo)}
        )
        RETURNING id, nombre_usuario, email, nombres, apellidos, 
                  telefono, departamento, cargo, rol_id, activo, 
                  fecha_creacion, fecha_actualizacion
      `;

      // Enviar email de bienvenida
      await emailService.enviarBienvenida(
        email.trim().toLowerCase(),
        nombres.trim(),
        nombre_usuario.trim()
      );

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: nuevosUsuarios[0]
      });

    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con esos datos únicos'
        });
      }

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida a rol'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza un usuario
   */
  async actualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { 
        nombre_usuario, 
        email, 
        nombres, 
        apellidos, 
        telefono,
        departamento,
        cargo,
        rol_id,
        activo
      } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      // Validar que no se esté intentando actualizar el email
      if (email !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'No se permite actualizar el email del usuario'
        });
      }

      if (!nombre_usuario && !nombres && !apellidos && 
          telefono === undefined && departamento === undefined && 
          cargo === undefined && !rol_id && activo === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      // Verificar que existe
      const existeUsuario = await sql`
        SELECT id FROM public.usuarios WHERE id = ${parseInt(id)}
      `;
      
      if (existeUsuario.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si se va a actualizar el rol, verificar que existe y está activo
      if (rol_id && !isNaN(parseInt(rol_id))) {
        const rolExiste = await sql`
          SELECT id FROM public.roles WHERE id = ${parseInt(rol_id)} AND activo = true
        `;

        if (rolExiste.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El rol especificado no existe o no está activo'
          });
        }
      }

      // Verificar unicidad de nombre_usuario si se va a actualizar
      if (nombre_usuario) {
        const usuarioExiste = await sql`
          SELECT id FROM public.usuarios 
          WHERE nombre_usuario = ${nombre_usuario.trim()} AND id != ${parseInt(id)}
        `;

        if (usuarioExiste.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otro usuario con ese nombre de usuario'
          });
        }
      }

      // Construir actualización dinámica (sin email)
      const updateFields = {};
      
      if (nombre_usuario !== undefined) updateFields.nombre_usuario = nombre_usuario.trim();
      if (nombres !== undefined) updateFields.nombres = nombres.trim();
      if (apellidos !== undefined) updateFields.apellidos = apellidos.trim();
      if (telefono !== undefined) updateFields.telefono = telefono || null;
      if (departamento !== undefined) updateFields.departamento = departamento || null;
      if (cargo !== undefined) updateFields.cargo = cargo || null;
      if (rol_id !== undefined) updateFields.rol_id = parseInt(rol_id);
      if (activo !== undefined) updateFields.activo = Boolean(activo);
      
      updateFields.fecha_actualizacion = sql`CURRENT_TIMESTAMP`;

      const usuariosActualizados = await sql`
        UPDATE public.usuarios 
        SET ${sql(updateFields)}
        WHERE id = ${parseInt(id)}
        RETURNING id, nombre_usuario, email, nombres, apellidos, 
                  telefono, departamento, cargo, rol_id, activo, 
                  ultimo_acceso, fecha_creacion, fecha_actualizacion
      `;

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuariosActualizados[0]
      });

    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con esos datos únicos'
        });
      }

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida a rol'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Elimina un usuario (soft delete)
   */
  async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      const existeUsuario = await sql`
        SELECT id FROM public.usuarios WHERE id = ${parseInt(id)}
      `;
      
      if (existeUsuario.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Soft delete - marcar como inactivo
      await sql`
        UPDATE public.usuarios 
        SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP 
        WHERE id = ${parseInt(id)}
      `;

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza el último acceso del usuario
   */
  async actualizarUltimoAcceso(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      const existeUsuario = await sql`
        SELECT id FROM public.usuarios WHERE id = ${parseInt(id)} AND activo = true
      `;
      
      if (existeUsuario.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      await sql`
        UPDATE public.usuarios 
        SET ultimo_acceso = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP 
        WHERE id = ${parseInt(id)}
      `;

      res.status(200).json({
        success: true,
        message: 'Último acceso actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error al actualizar último acceso:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Cambia la contraseña del usuario (requiere contraseña actual)
   */
  async cambiarContraseña(req, res) {
    try {
      const { id } = req.params;
      const { passwordActual, passwordNueva } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual y la nueva son requeridas'
        });
      }

      if (passwordNueva.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener usuario con contraseña
      const usuarios = await sql`
        SELECT id, email, nombres, password, activo
        FROM public.usuarios 
        WHERE id = ${parseInt(id)}
      `;

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuario = usuarios[0];

      if (!usuario.activo) {
        return res.status(403).json({
          success: false,
          message: 'Usuario inactivo'
        });
      }

      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
      
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Encriptar nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(passwordNueva, saltRounds);

      // Actualizar contraseña
      await sql`
        UPDATE public.usuarios 
        SET password = ${hashedPassword}, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ${parseInt(id)}
      `;

      // Enviar email de confirmación
      await emailService.enviarConfirmacionCambioPassword(
        usuario.email,
        usuario.nombres
      );

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Genera token de recuperación de contraseña y envía email
   */
  async recuperarContraseña(req, res) {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Email válido es requerido'
        });
      }

      // Buscar usuario por email
      const usuarios = await sql`
        SELECT id, email, nombres, activo
        FROM public.usuarios 
        WHERE email = ${email.trim().toLowerCase()}
      `;

      // Siempre responder con éxito por seguridad (no revelar si email existe)
      if (usuarios.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Si el email está registrado, recibirás las instrucciones de recuperación'
        });
      }

      const usuario = usuarios[0];

      if (!usuario.activo) {
        return res.status(200).json({
          success: true,
          message: 'Si el email está registrado, recibirás las instrucciones de recuperación'
        });
      }

      // Generar token seguro
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Invalidar tokens anteriores del usuario
      await sql`
        UPDATE password_reset_tokens 
        SET usado = true
        WHERE usuario_id = ${usuario.id} AND usado = false
      `;

      // Crear nuevo token
      await sql`
        INSERT INTO password_reset_tokens (usuario_id, token, expira_en)
        VALUES (${usuario.id}, ${token}, ${expiraEn})
      `;

      // Enviar email de recuperación
      await emailService.enviarRecuperacionPassword(
        usuario.email,
        usuario.nombres,
        token
      );

      res.status(200).json({
        success: true,
        message: 'Si el email está registrado, recibirás las instrucciones de recuperación'
      });

    } catch (error) {
      console.error('Error al recuperar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Restablece contraseña usando token de recuperación
   */
  async restablecerContraseña(req, res) {
    try {
      const { token, passwordNueva } = req.body;

      if (!token || !passwordNueva) {
        return res.status(400).json({
          success: false,
          message: 'Token y nueva contraseña son requeridos'
        });
      }

      if (passwordNueva.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Buscar token válido
      const tokens = await sql`
        SELECT prt.*, u.email, u.nombres
        FROM password_reset_tokens prt
        JOIN usuarios u ON prt.usuario_id = u.id
        WHERE prt.token = ${token} 
          AND prt.usado = false 
          AND prt.expira_en > NOW()
          AND u.activo = true
      `;

      if (tokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }

      const tokenData = tokens[0];

      // Encriptar nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(passwordNueva, saltRounds);

      // Actualizar contraseña
      await sql`
        UPDATE public.usuarios 
        SET password = ${hashedPassword}, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ${tokenData.usuario_id}
      `;

      // Marcar token como usado
      await sql`
        UPDATE password_reset_tokens 
        SET usado = true
        WHERE id = ${tokenData.id}
      `;

      // Enviar email de confirmación
      await emailService.enviarConfirmacionCambioPassword(
        tokenData.email,
        tokenData.nombres
      );

      res.status(200).json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      });

    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default UsuariosController;