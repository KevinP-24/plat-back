import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Configuración básica de Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API PLAT-EPA - Plataforma de Apoyo TIC',
    version: '1.0.0',
    description: 'API REST para gestión de tickets de soporte, roles y sistema de inventario de EPA E.S.P.',
    contact: {
      name: 'Equipo de Desarrollo PLAT-EPA',
      email: 'dev@epa.gov.co'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desarrollo'
    },
    {
      url: 'https://api.epa.gov.co',
      description: 'Servidor de producción'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // Esquemas para Roles
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
            minLength: 3,
            maxLength: 50,
            description: 'Nombre del rol',
            example: 'Administrador'
          },
          descripcion: {
            type: 'string',
            maxLength: 255,
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
            minLength: 3,
            maxLength: 50,
            description: 'Nombre del rol',
            example: 'Administrador'
          },
          descripcion: {
            type: 'string',
            maxLength: 255,
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

      // Esquemas para Tickets
      Ticket: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID único del ticket',
            example: 1
          },
          numero_ticket: {
            type: 'string',
            description: 'Número único del ticket generado automáticamente',
            example: "TICK-20250831-0001"
          },
          titulo: {
            type: 'string',
            description: 'Título descriptivo del ticket',
            example: "Problema con impresora de oficina"
          },
          descripcion: {
            type: 'string',
            description: 'Descripción detallada del problema o solicitud',
            example: "La impresora HP LaserJet no responde y muestra error de papel"
          },
          categoria_id: {
            type: 'integer',
            description: 'ID de la categoría del ticket',
            example: 1
          },
          categoria: {
            type: 'string',
            description: 'Nombre de la categoría del ticket',
            example: "Hardware"
          },
          prioridad_id: {
            type: 'integer',
            description: 'ID del nivel de prioridad',
            example: 1
          },
          prioridad: {
            type: 'string',
            description: 'Nivel de prioridad del ticket',
            example: "Alta"
          },
          prioridad_nivel: {
            type: 'integer',
            description: 'Nivel numérico de prioridad (1=Alta, 2=Media, 3=Baja)',
            example: 1
          },
          estado: {
            type: 'string',
            enum: ['Pendiente', 'En Progreso', 'Resuelto', 'Cerrado'],
            description: 'Estado actual del ticket',
            example: "Pendiente"
          },
          usuario_solicitante_id: {
            type: 'integer',
            description: 'ID del usuario que creó el ticket',
            example: 123
          },
          usuario_solicitante: {
            type: 'string',
            description: 'Nombre completo del usuario que creó el ticket',
            example: "Juan Pérez García"
          },
          usuario_email: {
            type: 'string',
            format: 'email',
            description: 'Email del usuario solicitante',
            example: "juan.perez@epa.gov.co"
          },
          tecnico_asignado_id: {
            type: 'integer',
            nullable: true,
            description: 'ID del técnico asignado',
            example: 456
          },
          tecnico_asignado: {
            type: 'string',
            nullable: true,
            description: 'Nombre del técnico asignado',
            example: "María González"
          },
          equipo_afectado_id: {
            type: 'integer',
            nullable: true,
            description: 'ID del equipo afectado',
            example: 15
          },
          equipo_afectado: {
            type: 'string',
            nullable: true,
            description: 'Nombre del equipo afectado si aplica',
            example: "Impresora HP-001"
          },
          fecha_creacion: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de creación del ticket',
            example: "2025-08-31T10:30:00Z"
          },
          fecha_asignacion: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Fecha y hora de asignación del ticket',
            example: "2025-08-31T11:00:00Z"
          },
          fecha_resolucion: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Fecha y hora de resolución del ticket',
            example: "2025-08-31T15:30:00Z"
          }
        }
      },
      TicketInput: {
        type: 'object',
        required: ['titulo', 'descripcion', 'categoria_id', 'prioridad_id'],
        properties: {
          titulo: {
            type: 'string',
            minLength: 5,
            maxLength: 255,
            description: 'Título descriptivo del problema o solicitud',
            example: "Problema con impresora de oficina"
          },
          descripcion: {
            type: 'string',
            minLength: 10,
            maxLength: 1000,
            description: 'Descripción detallada del problema (mínimo 10 caracteres)',
            example: "La impresora HP LaserJet de la oficina 201 no responde cuando se envían documentos para imprimir. El equipo muestra un error de papel aunque la bandeja está llena."
          },
          categoria_id: {
            type: 'integer',
            minimum: 1,
            description: 'ID de la categoría del ticket (1=Hardware, 2=Software, 3=Permisos)',
            example: 1
          },
          prioridad_id: {
            type: 'integer',
            minimum: 1,
            maximum: 3,
            description: 'ID del nivel de prioridad (1=Alta, 2=Media, 3=Baja)',
            example: 2
          },
          equipo_afectado_id: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'ID del equipo afectado (opcional)',
            example: 15
          }
        }
      },
      TicketUpdate: {
        type: 'object',
        properties: {
          titulo: {
            type: 'string',
            minLength: 5,
            maxLength: 255,
            description: 'Título descriptivo del problema o solicitud'
          },
          descripcion: {
            type: 'string',
            minLength: 10,
            maxLength: 1000,
            description: 'Descripción detallada del problema'
          },
          categoria_id: {
            type: 'integer',
            minimum: 1,
            description: 'ID de la categoría del ticket'
          },
          prioridad_id: {
            type: 'integer',
            minimum: 1,
            maximum: 3,
            description: 'ID del nivel de prioridad'
          },
          estado: {
            type: 'string',
            enum: ['Pendiente', 'En Progreso', 'Resuelto', 'Cerrado'],
            description: 'Estado del ticket'
          },
          tecnico_asignado_id: {
            type: 'integer',
            nullable: true,
            description: 'ID del técnico asignado'
          },
          equipo_afectado_id: {
            type: 'integer',
            nullable: true,
            description: 'ID del equipo afectado'
          }
        }
      },

      // Esquemas para Categorías
      Categoria: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID único de la categoría',
            example: 1
          },
          nombre: {
            type: 'string',
            description: 'Nombre de la categoría',
            example: "Hardware"
          },
          descripcion: {
            type: 'string',
            description: 'Descripción de la categoría',
            example: "Problemas relacionados con equipos físicos"
          }
        }
      },

      // Esquemas para Prioridades
      Prioridad: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'ID único de la prioridad',
          example: 1
        },
        nombre: {
          type: 'string',
          description: 'Nombre de la prioridad',
          example: "Alta"
        },
        nivel: {
          type: 'integer',
          description: 'Nivel numérico de la prioridad (1=Alta, 2=Media, 3=Baja)',
          example: 1
        },
        color: {
          type: 'string',
          description: 'Color hexadecimal para la interfaz',
          example: "#FF4444"
        },
        descripcion: {
          type: 'string',
          description: 'Descripción de la prioridad',
          example: "Problemas críticos"
        },
        activo: {
          type: 'boolean',
          description: 'Estado de la prioridad',
          example: true
        },
        fecha_creacion: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de creación',
          example: '2025-01-15T10:30:00.000Z'
        },
        fecha_actualizacion: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de última actualización',
          example: '2025-01-15T10:30:00.000Z'
        }
      }
    },

        // Esquemas para Estados de Ticket
    EstadoTicket: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'ID único del estado de ticket',
          example: 1
        },
        nombre: {
          type: 'string',
          description: 'Nombre del estado',
          example: "Pendiente"
        },
        descripcion: {
          type: 'string',
          description: 'Descripción del estado',
          example: "Ticket recién creado"
        },
        es_final: {
          type: 'boolean',
          description: 'Indica si es un estado final',
          example: false
        },
        orden: {
          type: 'integer',
          description: 'Orden de secuencia del estado',
          example: 1
        },
        activo: {
          type: 'boolean',
          description: 'Estado activo/inactivo',
          example: true
        }
      }
    },

    // Esquemas para Equipos
    Equipo: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'ID único del equipo',
          example: 1
        },
        codigo_inventario: {
          type: 'string',
          description: 'Código único de inventario',
          example: "EQ-001-2025"
        },
        nombre: {
          type: 'string',
          description: 'Nombre del equipo',
          example: "Computador HP EliteDesk"
        },
        descripcion: {
          type: 'string',
          description: 'Descripción detallada del equipo',
          example: "Computador de escritorio para tareas administrativas"
        },
        tipo_equipo_id: {
          type: 'integer',
          description: 'ID del tipo de equipo',
          example: 1
        },
        marca_id: {
          type: 'integer',
          description: 'ID de la marca',
          example: 1
        },
        modelo: {
          type: 'string',
          description: 'Modelo del equipo',
          example: "EliteDesk 800 G6"
        },
        numero_serie: {
          type: 'string',
          description: 'Número de serie del equipo',
          example: "HP123456789"
        },
        especificaciones: {
          type: 'object',
          description: 'Especificaciones técnicas en formato JSON',
          example: {"cpu": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}
        },
        estado_id: {
          type: 'integer',
          description: 'ID del estado actual del equipo',
          example: 1
        },
        ubicacion_id: {
          type: 'integer',
          description: 'ID de la ubicación del equipo',
          example: 1
        },
        usuario_asignado_id: {
          type: 'integer',
          nullable: true,
          description: 'ID del usuario asignado al equipo',
          example: 123
        },
        fecha_adquisicion: {
          type: 'string',
          format: 'date',
          description: 'Fecha de adquisición del equipo',
          example: "2025-01-15"
        },
        fecha_garantia: {
          type: 'string',
          format: 'date',
          nullable: true,
          description: 'Fecha de vencimiento de garantía',
          example: "2027-01-15"
        },
        valor_compra: {
          type: 'number',
          description: 'Valor de compra del equipo',
          example: 1500000.00
        },
        proveedor: {
          type: 'string',
          description: 'Proveedor del equipo',
          example: "TechSolutions S.A.S"
        },
        observaciones: {
          type: 'string',
          nullable: true,
          description: 'Observaciones adicionales',
          example: "Equipo en excelente estado"
        },
        fecha_creacion: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de creación del registro',
          example: "2025-01-15T10:30:00.000Z"
        },
        fecha_actualizacion: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de última actualización',
          example: "2025-01-15T10:30:00.000Z"
        }
      }
    },
    // Esquemas para Categorías
    Categoria: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'ID único de la categoría',
          example: 1
        },
        nombre: {
          type: 'string',
          description: 'Nombre de la categoría',
          example: "Hardware"
        },
        descripcion: {
          type: 'string',
          description: 'Descripción de la categoría',
          example: "Problemas con equipos físicos"
        },
        activo: {
          type: 'boolean',
          description: 'Estado activo/inactivo de la categoría',
          example: true
        },
        fecha_creacion: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de creación de la categoría',
          example: "2025-08-25T03:59:24.185Z"
        }
      }
    },

      // Esquemas de respuesta
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
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Campo que causó el error'
                },
                message: {
                  type: 'string',
                  description: 'Mensaje específico del error'
                }
              }
            },
            description: 'Detalles específicos de errores de validación'
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
            examples: {
              rolNoEncontrado: {
                summary: 'Rol no encontrado',
                value: {
                  success: false,
                  message: 'Rol no encontrado'
                }
              },
              ticketNoEncontrado: {
                summary: 'Ticket no encontrado',
                value: {
                  success: false,
                  message: 'Ticket no encontrado'
                }
              }
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
            examples: {
              campoRequerido: {
                summary: 'Campo requerido faltante',
                value: {
                  success: false,
                  message: 'Datos de entrada inválidos',
                  errors: [
                    {
                      field: 'nombre',
                      message: 'El nombre del rol es requerido'
                    }
                  ]
                }
              },
              datosInvalidos: {
                summary: 'Datos inválidos',
                value: {
                  success: false,
                  message: 'Los datos proporcionados no son válidos'
                }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'No autorizado - Token requerido',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Token de autenticación requerido'
            }
          }
        }
      },
      Forbidden: {
        description: 'Prohibido - Sin permisos suficientes',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'No tienes permisos para realizar esta acción'
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
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Opciones para swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './routes/roles.js',
    './routes/tickets.js',
    './routes/auth.js',
    './routes/prioridades.js',
    './routes/estadoTicket.js',
    './routes/equipo.js',
    './routes/categoria.js'
  ], // rutas donde están los comentarios JSDoc
};

// Generar especificación
const swaggerSpec = swaggerJSDoc(options);

// Configuración de middleware de Swagger UI
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    displayRequestDuration: true
  }
};

export { swaggerUi, swaggerSpec, swaggerOptions };