import express from 'express';
import RolesController from '../controllers/rol.controller.js';

const router = express.Router();
const rolesController = new RolesController();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener todos los roles
 *     description: Retorna una lista de todos los roles del sistema con filtros opcionales
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *         example: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Desplazamiento para paginación
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rol'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', rolesController.obtenerRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener un rol por ID
 *     description: Retorna un rol específico basado en su ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del rol
 *         example: 1
 *     responses:
 *       200:
 *         description: Rol encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Rol'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', rolesController.obtenerRolPorId);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear un nuevo rol
 *     description: Crea un nuevo rol en el sistema
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolInput'
 *           example:
 *             nombre: "Administrador"
 *             descripcion: "Acceso completo al sistema"
 *             activo: true
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Rol'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Conflicto - El rol ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Ya existe un rol con ese nombre"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', rolesController.crearRol);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar un rol existente
 *     description: Actualiza los datos de un rol específico
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolUpdate'
 *           example:
 *             nombre: "Super Administrador"
 *             descripcion: "Acceso completo con permisos especiales"
 *             activo: true
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Rol'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflicto - El nombre ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Ya existe otro rol con ese nombre"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', rolesController.actualizarRol);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar un rol (soft delete)
 *     description: Marca un rol como inactivo en lugar de eliminarlo permanentemente
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol eliminado exitosamente"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', rolesController.eliminarRol);

export default router;