// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config();

// Ahora importar el resto
import express from 'express';
import cors from 'cors';
import { swaggerUi, swaggerSpec } from './config/swagger.js';

// Importar rutas de ENDPOINTS
import rolesRoutes from './routes/rol.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS para permitir solicitudes desde el frontend
app.use(cors({
  origin: [
    'http://localhost:4200', // Para desarrollo local
    'https://tu-frontend-url.onrender.com', // Para producción (cambiar por tu URL real)
    process.env.FRONTEND_URL // Variable de entorno para flexibilidad
  ].filter(Boolean), // Filtrar valores undefined
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], // Los métodos permitidos
  credentials: true // Si se requieren cookies o credenciales, establece esto en true
}));

// Middleware
app.use(express.json());

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({
    message: 'API PLAT-EPA Backend',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `No se encontró la ruta ${req.originalUrl}`
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend ejecutándose en puerto ${PORT}`);
  console.log(`📚 Swagger UI disponible en /api-docs`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('🗄️  Base de datos:', process.env.DATABASE_URL ? 'Configurada ✓' : 'No configurada ✗');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 URL local: http://localhost:${PORT}`);
  }
});