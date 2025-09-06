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
   * ✅
   */
  async obtenerUsuarios(req, res) {
    try {
      const { activo, departamento, rol_id, search, limit = 50, offset = 0 } = req.query;
      
      let baseQuery = sql`
        SELECT 
          u.id, 
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
          LOWER(u.email) LIKE LOWER(${`%${search}%`})
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
   * ✅
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
   * Crea un nuevo usuario con sistema de activación por email
   */
  async crearUsuario(req, res) {
    try {
      const { 
        email, 
        nombres, 
        apellidos, 
        telefono,
        departamento,
        cargo,
        rol_id,
        password
        // Removemos activo del body, siempre será false por defecto
      } = req.body;

      // Validaciones requeridas
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

      // Crear usuario con activo = false (requiere activación)
      const nuevosUsuarios = await sql`
        INSERT INTO public.usuarios (
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
          ${email.trim().toLowerCase()}, 
          ${nombres.trim()}, 
          ${apellidos.trim()}, 
          ${telefono || null},
          ${departamento || null},
          ${cargo || null},
          ${parseInt(rol_id)},
          ${hashedPassword},
          false
        )
        RETURNING id, email, nombres, apellidos, 
                  telefono, departamento, cargo, rol_id, activo, 
                  fecha_creacion, fecha_actualizacion
      `;

      const nuevoUsuario = nuevosUsuarios[0];

      // Generar código de activación (6 dígitos numéricos)
      const codigoActivacion = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Calcular fecha de expiración (24 horas desde ahora)
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);

      // Guardar código de activación en password_reset_tokens
      await sql`
        INSERT INTO public.password_reset_tokens (
          usuario_id,
          token,
          expira_en,
          usado,
          fecha_creacion
        )
        VALUES (
          ${nuevoUsuario.id},
          ${codigoActivacion},
          ${fechaExpiracion},
          false,
          NOW()
        )
      `;

      // Enviar email de activación
      const emailResult = await emailService.enviarActivacionCuenta(
        email.trim().toLowerCase(),
        nombres.trim(),
        codigoActivacion
      );

      if (!emailResult.success) {
        console.warn('⚠️ Usuario creado pero email de activación falló:', emailResult.error);
      }

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente. Se ha enviado un código de activación a tu email',
        data: {
          id: nuevoUsuario.id,
          email: nuevoUsuario.email,
          nombres: nuevoUsuario.nombres,
          apellidos: nuevoUsuario.apellidos,
          telefono: nuevoUsuario.telefono,
          departamento: nuevoUsuario.departamento,
          cargo: nuevoUsuario.cargo,
          rol_id: nuevoUsuario.rol_id,
          activo: nuevoUsuario.activo, // false
          fecha_creacion: nuevoUsuario.fecha_creacion,
          email_enviado: emailResult.success
        }
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

      if (!nombres && !apellidos && 
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

      // Construir actualización dinámica (sin email y sin nombre_usuario)
      const updateFields = {};
      
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
        RETURNING id, email, nombres, apellidos, 
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

      // Verificar que el usuario existe y obtener información básica
      const usuario = await sql`
        SELECT id, email, nombres, apellidos, activo 
        FROM public.usuarios 
        WHERE id = ${parseInt(id)}
      `;
      
      if (usuario.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuarioData = usuario[0];

      // Verificar si ya está inactivo
      if (!usuarioData.activo) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya está desactivado'
        });
      }

      // Prevenir auto-eliminación (opcional - por seguridad)
      if (req.user && req.user.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propia cuenta'
        });
      }

      // Soft delete - marcar como inactivo
      const usuarioActualizado = await sql`
        UPDATE public.usuarios 
        SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP 
        WHERE id = ${parseInt(id)}
        RETURNING id, email, nombres, apellidos, activo, fecha_actualizacion
      `;

      // Log de la acción para auditoría
      console.log('Usuario desactivado:', {
        usuario_desactivado: {
          id: usuarioData.id,
          email: usuarioData.email,
          nombres: usuarioData.nombres,
          apellidos: usuarioData.apellidos
        },
        accion_realizada_por: req.user ? {
          id: req.user.id,
          email: req.user.email
        } : 'Sistema',
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: `Usuario ${usuarioData.nombres} ${usuarioData.apellidos} desactivado exitosamente`,
        data: {
          id: usuarioActualizado[0].id,
          email: usuarioActualizado[0].email,
          nombres: usuarioActualizado[0].nombres,
          apellidos: usuarioActualizado[0].apellidos,
          activo: usuarioActualizado[0].activo,
          fecha_desactivacion: usuarioActualizado[0].fecha_actualizacion
        }
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
  /**
   * Activa la cuenta de un usuario mediante código de verificación
   * Endpoint: POST /api/usuarios/activar
   * Acceso: Público (sin autenticación)
   */
  async activarCuenta(req, res) {
    try {
      const { email, codigo } = req.body;

      // Validaciones de entrada
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido y debe ser válido',
          error: 'INVALID_EMAIL'
        });
      }

      if (!codigo || typeof codigo !== 'string' || codigo.trim().length !== 6) {
        return res.status(400).json({
          success: false,
          message: 'El código de activación debe tener exactamente 6 dígitos',
          error: 'INVALID_CODE_FORMAT'
        });
      }

      // Buscar usuario por email
      const usuarios = await sql`
        SELECT u.id, u.nombres, u.apellidos, u.email, u.activo,
              r.nombre as rol_nombre
        FROM public.usuarios u
        LEFT JOIN public.roles r ON u.rol_id = r.id
        WHERE u.email = ${email.trim().toLowerCase()}
      `;

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró ninguna cuenta asociada a este email',
          error: 'USER_NOT_FOUND'
        });
      }

      const usuario = usuarios[0];

      // Verificar si la cuenta ya está activa
      if (usuario.activo) {
        return res.status(400).json({
          success: false,
          message: 'Esta cuenta ya se encuentra activa. Puedes iniciar sesión normalmente',
          error: 'ACCOUNT_ALREADY_ACTIVE'
        });
      }

      // Buscar el código de activación
      const tokens = await sql`
        SELECT id, token, expira_en, usado, fecha_creacion
        FROM public.password_reset_tokens 
        WHERE usuario_id = ${usuario.id} 
          AND token = ${codigo.trim()}
          AND usado = false
        ORDER BY fecha_creacion DESC
        LIMIT 1
      `;

      if (tokens.length === 0) {
        // Log del intento fallido para seguridad
        console.warn('❌ Intento de activación con código inválido:', {
          email: email.trim().toLowerCase(),
          codigo: codigo.trim(),
          user_id: usuario.id,
          timestamp: new Date().toISOString(),
          ip: req.ip || 'unknown'
        });

        return res.status(400).json({
          success: false,
          message: 'El código de activación es incorrecto o ya ha sido utilizado',
          error: 'INVALID_OR_USED_CODE'
        });
      }

      const tokenData = tokens[0];

      // Verificar si el código ha expirado
      const ahora = new Date();
      const fechaExpiracion = new Date(tokenData.expira_en);
      
      if (ahora > fechaExpiracion) {
        console.warn('⏰ Intento de activación con código expirado:', {
          email: email.trim().toLowerCase(),
          user_id: usuario.id,
          expira_en: tokenData.expira_en,
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          success: false,
          message: 'El código de activación ha expirado. Solicita un nuevo código',
          error: 'CODE_EXPIRED',
          data: {
            expiro_en: fechaExpiracion.toISOString(),
            puede_reenviar: true
          }
        });
      }

      // ✅ Código válido - Proceder con la activación
      
      try {
        // Iniciar transacción implícita
        
        // 1. Activar la cuenta del usuario
        const usuarioActualizado = await sql`
          UPDATE public.usuarios 
          SET activo = true, 
              fecha_actualizacion = NOW()
          WHERE id = ${usuario.id}
          RETURNING id, email, nombres, apellidos, activo, fecha_actualizacion
        `;

        // 2. Marcar el código como usado
        await sql`
          UPDATE public.password_reset_tokens 
          SET usado = true
          WHERE id = ${tokenData.id}
        `;

        // 3. Enviar email de confirmación (opcional - no fallar si falla)
        let emailConfirmacionEnviado = false;
        try {
          const emailResult = await emailService.enviarConfirmacionActivacion(
            usuario.email,
            usuario.nombres
          );
          emailConfirmacionEnviado = emailResult.success;
          
          if (!emailResult.success) {
            console.warn('⚠️ No se pudo enviar email de confirmación:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Error al enviar email de confirmación:', emailError);
        }

        // 4. Log exitoso para auditoría
        console.log('✅ Cuenta activada exitosamente:', {
          user_id: usuario.id,
          email: usuario.email,
          nombres: usuario.nombres,
          rol: usuario.rol_nombre,
          fecha_activacion: new Date().toISOString(),
          ip: req.ip || 'unknown',
          user_agent: req.get('User-Agent') || 'unknown'
        });

        // 5. Respuesta exitosa
        res.status(200).json({
          success: true,
          message: `¡Felicitaciones ${usuario.nombres}! Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión.`,
          data: {
            user: {
              id: usuarioActualizado[0].id,
              email: usuarioActualizado[0].email,
              nombres: usuarioActualizado[0].nombres,
              apellidos: usuarioActualizado[0].apellidos,
              activo: usuarioActualizado[0].activo,
              rol: usuario.rol_nombre
            },
            activacion: {
              fecha_activacion: usuarioActualizado[0].fecha_actualizacion,
              email_confirmacion_enviado: emailConfirmacionEnviado,
              puede_iniciar_sesion: true
            }
          }
        });

      } catch (dbError) {
        console.error('❌ Error en base de datos durante activación:', dbError);
        
        return res.status(500).json({
          success: false,
          message: 'Error interno al activar la cuenta. Intenta nuevamente',
          error: 'DATABASE_ERROR'
        });
      }

    } catch (error) {
      console.error('❌ Error general en activación de cuenta:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor. Por favor, intenta más tarde',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
  /**
   * Valida el código de activación y activa la cuenta del usuario
   */
  async validarCodigoActivacion(req, res) {
    try {
      const { email, codigo } = req.body;

      // Validaciones básicas
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido y debe ser válido'
        });
      }

      if (!codigo || typeof codigo !== 'string' || codigo.trim().length !== 6) {
        return res.status(400).json({
          success: false,
          message: 'El código de activación debe tener 6 dígitos'
        });
      }

      // Buscar al usuario por email
      const usuarios = await sql`
        SELECT id, nombres, apellidos, email, activo 
        FROM public.usuarios 
        WHERE email = ${email.trim().toLowerCase()}
      `;

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró una cuenta con ese email'
        });
      }

      const usuario = usuarios[0];

      // Verificar si la cuenta ya está activa
      if (usuario.activo) {
        return res.status(400).json({
          success: false,
          message: 'Esta cuenta ya está activada'
        });
      }

      // Buscar el código de activación en password_reset_tokens
      const tokens = await sql`
        SELECT id, token, expira_en, usado, fecha_creacion
        FROM public.password_reset_tokens 
        WHERE usuario_id = ${usuario.id} 
          AND token = ${codigo.trim()}
          AND usado = false
        ORDER BY fecha_creacion DESC
        LIMIT 1
      `;

      if (tokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Código de activación inválido o ya utilizado'
        });
      }

      const tokenData = tokens[0];

      // Verificar si el código ha expirado
      const ahora = new Date();
      if (ahora > new Date(tokenData.expira_en)) {
        return res.status(400).json({
          success: false,
          message: 'El código de activación ha expirado. Solicita uno nuevo'
        });
      }

      // Todo está correcto, proceder con la activación
      
      // 1. Activar el usuario
      await sql`
        UPDATE public.usuarios 
        SET activo = true, fecha_actualizacion = NOW()
        WHERE id = ${usuario.id}
      `;

      // 2. Marcar el token como usado
      await sql`
        UPDATE public.password_reset_tokens 
        SET usado = true
        WHERE id = ${tokenData.id}
      `;

      // 3. Enviar email de confirmación de activación (opcional)
      const emailResult = await emailService.enviarConfirmacionActivacion(
        usuario.email,
        usuario.nombres
      );

      // 4. Log de la activación exitosa
      console.log('✅ Cuenta activada exitosamente:', {
        user_id: usuario.id,
        email: usuario.email,
        fecha_activacion: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión',
        data: {
          user_id: usuario.id,
          email: usuario.email,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          activo: true,
          fecha_activacion: new Date().toISOString(),
          email_confirmacion_enviado: emailResult.success
        }
      });

    } catch (error) {
      console.error('Error al validar código de activación:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  /**
   * Reenvía un código de activación para cuentas no activadas
   */
  async reenviarCodigoActivacion(req, res) {
    try {
      const { email } = req.body;

      // Validación básica
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido y debe ser válido'
        });
      }

      // Buscar al usuario
      const usuarios = await sql`
        SELECT id, nombres, email, activo 
        FROM public.usuarios 
        WHERE email = ${email.trim().toLowerCase()}
      `;

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró una cuenta con ese email'
        });
      }

      const usuario = usuarios[0];

      // Verificar si la cuenta ya está activa
      if (usuario.activo) {
        return res.status(400).json({
          success: false,
          message: 'Esta cuenta ya está activada'
        });
      }

      // Verificar límite de reenvíos (opcional - prevenir spam)
      const reenviosHoy = await sql`
        SELECT COUNT(*) as total
        FROM public.password_reset_tokens 
        WHERE usuario_id = ${usuario.id}
          AND fecha_creacion >= NOW() - INTERVAL '24 hours'
      `;

      if (reenviosHoy[0].total >= 5) { // Máximo 5 códigos por día
        return res.status(429).json({
          success: false,
          message: 'Has alcanzado el límite de códigos por día. Intenta mañana'
        });
      }

      // Invalidar códigos anteriores (opcional)
      await sql`
        UPDATE public.password_reset_tokens 
        SET usado = true
        WHERE usuario_id = ${usuario.id} AND usado = false
      `;

      // Generar nuevo código
      const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Calcular nueva fecha de expiración (24 horas)
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);

      // Guardar nuevo código
      await sql`
        INSERT INTO public.password_reset_tokens (
          usuario_id,
          token,
          expira_en,
          usado,
          fecha_creacion
        )
        VALUES (
          ${usuario.id},
          ${nuevoCodigo},
          ${fechaExpiracion},
          false,
          NOW()
        )
      `;

      // Enviar nuevo código por email
      const emailResult = await emailService.enviarActivacionCuenta(
        usuario.email,
        usuario.nombres,
        nuevoCodigo
      );

      res.status(200).json({
        success: true,
        message: 'Se ha enviado un nuevo código de activación a tu email',
        data: {
          email: usuario.email,
          codigo_enviado: emailResult.success
        }
      });

    } catch (error) {
      console.error('Error al reenviar código de activación:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default UsuariosController;