// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config();

// Ahora importar el resto
import express from 'express';
import cors from 'cors';
import { swaggerUi, swaggerSpec } from './config/swagger.js';


//importar rutas de ENDPOINTS
import rolesRoutes from './routes/rol.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend en http://localhost:${PORT}`);
  console.log(`Swagger UI en http://localhost:${PORT}/api-docs`);
  console.log('Base de datos:', process.env.DATABASE_URL ? 'Configurada ✓' : 'No configurada ✗');
});