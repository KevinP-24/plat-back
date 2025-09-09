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
import prioridadesRoutes from './routes/prioridades.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS
app.use(cors({
  origin: [
    'http://localhost:4200',        // Desarrollo local (Angular CLI)
    'https://plat-epa.web.app',     // Producción (Firebase Hosting)
    process.env.FRONTEND_URL        // Extra: si defines otra URL en variables de entorno
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/prioridades', prioridadesRoutes);

// Catch-all para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `No se encontró la ruta ${req.originalUrl}`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend en http://localhost:${PORT}`);
  console.log(`📚 Swagger UI en http://localhost:${PORT}/api-docs`);
  console.log('🗄️ Base de datos:', process.env.DATABASE_URL ? 'Configurada ✓' : 'No configurada ✗');
});
