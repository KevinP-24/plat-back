// controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import sql from '../config/db.js'
import jwtUtils from '../utils/jwt.js'; 

class AuthController {
    /**
     * Autentica a un usuario y genera token JWT
     * Endpoint: POST /api/auth/login
     * Acceso: Público (sin autenticación)
     */
    async login(req, res) {
    try {
        const { email, password } = req.body;

        // Validar que se proporcione email y contraseña
        if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos',
            error: 'MISSING_CREDENTIALS'
        });
        }

        // Validar formato de email
        if (!email.includes('@') || typeof email !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'El formato del email no es válido',
            error: 'INVALID_EMAIL_FORMAT'
        });
        }

        // Validar que la contraseña no esté vacía
        if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña es requerida',
            error: 'MISSING_PASSWORD'
        });
        }

        // Buscar usuario por email
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
            u.password,
            u.activo,
            u.ultimo_acceso,
            u.fecha_creacion,
            r.nombre as rol_nombre,
            r.activo as rol_activo
        FROM public.usuarios u
        LEFT JOIN public.roles r ON u.rol_id = r.id
        WHERE u.email = ${email.trim().toLowerCase()}
        `;

        // Verificar si el usuario existe
        if (usuarios.length === 0) {
        // Log del intento fallido para auditoría
        console.warn('🚫 Intento de login con credenciales no encontradas:', {
            email: email || null,
            ip: req.ip || 'unknown',
            user_agent: req.get('User-Agent') || 'unknown',
            timestamp: new Date().toISOString()
        });

        return res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas',
            error: 'INVALID_CREDENTIALS'
        });
        }

        const usuario = usuarios[0];

        // Verificar si la cuenta está activa
        if (!usuario.activo) {
        console.warn('🚫 Intento de login con cuenta inactiva:', {
            user_id: usuario.id,
            email: usuario.email,
            ip: req.ip || 'unknown',
            timestamp: new Date().toISOString()
        });

        return res.status(401).json({
            success: false,
            message: 'Tu cuenta no está activada. Revisa tu email para el código de activación',
            error: 'ACCOUNT_NOT_ACTIVATED',
            data: {
            email: usuario.email,
            puede_reactivar: true
            }
        });
        }

        // Verificar si el rol está activo
        if (!usuario.rol_activo) {
        console.warn('🚫 Intento de login con rol inactivo:', {
            user_id: usuario.id,
            email: usuario.email,
            rol_id: usuario.rol_id,
            rol_nombre: usuario.rol_nombre,
            timestamp: new Date().toISOString()
        });

        return res.status(401).json({
            success: false,
            message: 'Tu rol ha sido desactivado. Contacta al administrador',
            error: 'ROLE_INACTIVE'
        });
        }

        // Verificar la contraseña
        const passwordValida = await bcrypt.compare(password.trim(), usuario.password);
        
        if (!passwordValida) {
        // Log del intento fallido para auditoría
        console.warn('🚫 Intento de login con contraseña incorrecta:', {
            user_id: usuario.id,
            email: usuario.email,
            ip: req.ip || 'unknown',
            user_agent: req.get('User-Agent') || 'unknown',
            timestamp: new Date().toISOString()
        });

        return res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas',
            error: 'INVALID_CREDENTIALS'
        });
        }

        // ✅ Credenciales válidas - Proceder con el login

        try {
        // Generar tokens JWT
        const tokenPayload = {
            id: usuario.id,
            email: usuario.email,
            rol_id: usuario.rol_id,
            rol_nombre: usuario.rol_nombre
        };

        const accessToken = jwtUtils.generateToken(tokenPayload);
        const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

        // Actualizar último acceso
        await sql`
            UPDATE public.usuarios 
            SET ultimo_acceso = NOW(), fecha_actualizacion = NOW()
            WHERE id = ${usuario.id}
        `;

        // Log exitoso para auditoría (cumple RNF-04)
        console.log('✅ Login exitoso:', {
            user_id: usuario.id,
            email: usuario.email,
            rol: usuario.rol_nombre,
            ip: req.ip || 'unknown',
            user_agent: req.get('User-Agent') || 'unknown',
            timestamp: new Date().toISOString()
        });

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            message: `¡Bienvenido ${usuario.nombres}!`,
            data: {
            user: {
                id: usuario.id,
                email: usuario.email,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                telefono: usuario.telefono,
                departamento: usuario.departamento,
                cargo: usuario.cargo,
                rol: {
                id: usuario.rol_id,
                nombre: usuario.rol_nombre
                },
                ultimo_acceso: new Date().toISOString(),
                fecha_creacion: usuario.fecha_creacion
            },
            tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: process.env.JWT_EXPIRES_IN || '24h'
            },
            permisos: {
                es_admin: usuario.rol_nombre.toLowerCase() === 'administrador',
                es_tecnico: usuario.rol_nombre.toLowerCase() === 'tecnico',
                es_usuario_final: usuario.rol_nombre.toLowerCase() === 'usuario final'
            }
            }
        });

        } catch (tokenError) {
        console.error('❌ Error generando tokens JWT:', tokenError);
        
        return res.status(500).json({
            success: false,
            message: 'Error interno al generar tokens de sesión',
            error: 'TOKEN_GENERATION_ERROR'
        });
        }

    } catch (error) {
        console.error('❌ Error general en login:', {
        error: error.message,
        stack: error.stack,
        body: {
            email: req.body.email || null,
            // No registrar la contraseña por seguridad
        },
        timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
        });
    }
    }

    /**
     * Cierra la sesión del usuario (logout)
     * Endpoint: POST /api/auth/logout
     * Acceso: Requiere token válido
     */
    async logout(req, res) {
    try {
        // El token ya fue verificado por el middleware verifyToken
        const usuario = req.user;

        // Log de logout para auditoría
        console.log('📤 Logout exitoso:', {
        user_id: usuario.id,
        email: usuario.email,
        ip: req.ip || 'unknown',
        timestamp: new Date().toISOString()
        });

        // En el futuro podrías agregar el token a una blacklist
        // await addTokenToBlacklist(req.token);

        res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
        data: {
            logout_time: new Date().toISOString()
        }
        });

    } catch (error) {
        console.error('❌ Error en logout:', error);
        
        res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
        });
    }
    }

    /**
     * Verifica el estado de la sesión actual
     * Endpoint: GET /api/auth/me
     * Acceso: Requiere token válido
     */
    async verificarSesion(req, res) {
    try {
        const usuario = req.user;

        // Obtener información actualizada del usuario
        const usuarioActualizado = await sql`
        SELECT 
            u.id,
            u.email,
            u.nombres,
            u.apellidos,
            u.telefono,
            u.departamento,
            u.cargo,
            u.rol_id,
            u.activo,
            u.ultimo_acceso,
            r.nombre as rol_nombre,
            r.activo as rol_activo
        FROM public.usuarios u
        LEFT JOIN public.roles r ON u.rol_id = r.id
        WHERE u.id = ${usuario.id}
        `;

        if (usuarioActualizado.length === 0 || !usuarioActualizado[0].activo) {
        return res.status(401).json({
            success: false,
            message: 'Sesión inválida. Por favor, inicia sesión nuevamente',
            error: 'INVALID_SESSION'
        });
        }

        const user = usuarioActualizado[0];

        res.status(200).json({
        success: true,
        data: {
            user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            telefono: user.telefono,
            departamento: user.departamento,
            cargo: user.cargo,
            rol: {
                id: user.rol_id,
                nombre: user.rol_nombre
            },
            ultimo_acceso: user.ultimo_acceso,
            session_info: usuario.token_info
            },
            permisos: {
            es_admin: user.rol_nombre.toLowerCase() === 'administrador',
            es_tecnico: user.rol_nombre.toLowerCase() === 'tecnico',
            es_usuario_final: user.rol_nombre.toLowerCase() === 'usuario final'
            }
        }
        });

    } catch (error) {
        console.error('❌ Error verificando sesión:', error);
        
        res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
        });
    }
    }
}

export default new AuthController();