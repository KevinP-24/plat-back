import express from 'express';
import CategoriaController from '../controllers/categoria.controller.js';

const router = express.Router();
const categoriaController = new CategoriaController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la categoría
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre de la categoría
 *           example: "Hardware"
 *         descripcion:
 *           type: string
 *           description: Descripción de la categoría
 *           example: "Problemas con equipos físicos"
 *         activo:
 *           type: boolean
 *           description: Estado activo/inactivo de la categoría
 *           example: true
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la categoría
 *           example: "2025-08-25T03:59:24.185Z"
 *     
 *     CategoriaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Categoria'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error interno del servidor"
 */

/**
 * @swagger
 * /api/categoria:
 *   get:
 *     summary: Obtiene todas las categorías
 *     description: Recupera una lista de todas las categorías del sistema con filtros opcionales
 *     tags: [Categoria]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por categorías activas o inactivas
 *         example: "true"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número máximo de registros a devolver
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Número de registros a omitir
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriaResponse'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 1
 *                       nombre: "Hardware"
 *                       descripcion: "Problemas con equipos físicos"
 *                       activo: true
 *                       fecha_creacion: "2025-08-25T03:59:24.185Z"
 *                     - id: 2
 *                       nombre: "Software"
 *                       descripcion: "Problemas con aplicaciones"
 *                       activo: true
 *                       fecha_creacion: "2025-08-25T03:59:24.185Z"
 *                     - id: 3
 *                       nombre: "Red"
 *                       descripcion: "Problemas de conectividad"
 *                       activo: true
 *                       fecha_creacion: "2025-08-25T03:59:24.185Z"
 *                     - id: 4
 *                       nombre: "Permisos"
 *                       descripcion: "Solicitudes de acceso"
 *                       activo: true
 *                       fecha_creacion: "2025-08-25T03:59:24.185Z"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', categoriaController.obtenerCategorias);

/**
 * @swagger
 * /api/categoria/{id}:
 *   get:
 *     summary: Obtiene una categoría por ID
 *     description: Recupera los detalles de una categoría específica mediante su ID
 *     tags: [Categoria]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único de la categoría
 *         example: 1
 *     responses:
 *       200:
 *         description: Categoría encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriaResponse'
 *             examples:
 *               success:
 *                 summary: Categoría encontrada
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     nombre: "Hardware"
 *                     descripcion: "Problemas con equipos físicos"
 *                     activo: true
 *                     fecha_creacion: "2025-08-25T03:59:24.185Z"
 *       400:
 *         description: ID de categoría inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_id:
 *                 summary: ID inválido
 *                 value:
 *                   success: false
 *                   message: "ID de categoría inválido"
 *       404:
 *         description: Categoría no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Categoría no encontrada
 *                 value:
 *                   success: false
 *                   message: "Categoría no encontrada"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', categoriaController.obtenerCategoriaPorId);

export default router;