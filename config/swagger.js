import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Configuración básica de Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de Roles',
    version: '1.0.0',
    description: 'API REST para gestión de roles del sistema',
    contact: {
      name: 'Desarrollador',
      email: 'dev@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desarrollo'
    }
  ],
  components: {
    schemas: {
      Rol: {
        type: 'object',
        required: ['nombre'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID único del rol',
            example: 1
          },
          nombre: {
            type: 'string',
            description: 'Nombre del rol (único)',
            example: 'Administrador'
          },
          descripcion: {
            type: 'string',
            description: 'Descripción del rol',
            example: 'Acceso completo al sistema',
            nullable: true
          },
          activo: {
            type: 'boolean',
            description: 'Estado del rol',
            example: true,
            default: true
          },
          fecha_creacion: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación del rol',
            example: '2024-01-15T10:30:00.000Z'
          },
          fecha_actualizacion: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización',
            example: '2024-01-15T10:30:00.000Z'
          }
        }
      },
      RolInput: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre del rol',
            example: 'Administrador'
          },
          descripcion: {
            type: 'string',
            description: 'Descripción del rol',
            example: 'Acceso completo al sistema'
          },
          activo: {
            type: 'boolean',
            description: 'Estado del rol',
            example: true,
            default: true
          }
        }
      },
      RolUpdate: {
        type: 'object',
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre del rol',
            example: 'Administrador'
          },
          descripcion: {
            type: 'string',
            description: 'Descripción del rol',
            example: 'Acceso completo al sistema'
          },
          activo: {
            type: 'boolean',
            description: 'Estado del rol',
            example: true
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indica si la operación fue exitosa'
          },
          message: {
            type: 'string',
            description: 'Mensaje descriptivo de la operación'
          },
          data: {
            description: 'Datos devueltos por la operación'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            description: 'Mensaje de error',
            example: 'Error interno del servidor'
          }
        }
      }
    },
    responses: {
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Rol no encontrado'
            }
          }
        }
      },
      BadRequest: {
        description: 'Solicitud inválida',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'El nombre del rol es requerido'
            }
          }
        }
      },
      InternalError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Error interno del servidor'
            }
          }
        }
      }
    }
  }
};

// Opciones para swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: ['./routes/*.js'], // rutas donde están los comentarios JSDoc
};

// Generar especificación
const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };