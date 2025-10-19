// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config();

// Ahora importar el resto
import express from 'express';
import cors from 'cors';
import { swaggerUi, swaggerSpec } from './config/swagger.js';
import { testConnection } from './config/db.js';

// Importar rutas de ENDPOINTS
import rolesRoutes from './routes/rol.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import prioridadesRoutes from './routes/prioridades.routes.js';
import estadoTicketRoutes from './routes/estadoTicket.routes.js';
import equipoRoutes from './routes/equipo.routes.js';
import categoriaRoutes from './routes/categoria.routes.js';
import historialEquipoRoutes from './routes/historialEquipo.routes.js';

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
app.use('/api/estados-ticket', estadoTicketRoutes);
app.use('/api/equipo', equipoRoutes); 
app.use('/api/categoria', categoriaRoutes);
app.use('/api/historialEquipo',historialEquipoRoutes)

// Catch-all para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `No se encontró la ruta ${req.originalUrl}`
  });
});

// Función para iniciar el servidor con verificación de BD
async function startServer() {
  // Probar conexión a base de datos ANTES de iniciar el servidor
  console.log('\n Verificando conexión a base de datos...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('\n ADVERTENCIA: No se pudo conectar a la base de datos');
    console.error('  El servidor iniciará pero las operaciones de BD fallarán\n');
    // Si prefieres que NO inicie sin BD, descomenta la siguiente línea:
    // process.exit(1);
  }

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║           PLAT Backend Server Iniciado                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\n Backend:        http://localhost:${PORT}`);
    console.log(` Swagger UI:     http://localhost:${PORT}/api-docs`);
    console.log(` Base de datos:  ${dbConnected ? ' Conectada' : ' Error de conexión'}`);
    console.log(` Iniciado:       ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

// Iniciar el servidor
startServer().catch(error => {
  console.error(' Error fatal al iniciar el servidor:', error);
  process.exit(1);
});