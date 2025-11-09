import postgres from 'postgres';

// Cloud Run inyecta las variables de entorno, no necesitamos dotenv.config()

// Verificar que la variable de entorno esté disponible
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL no está configurada');
  throw new Error('DATABASE_URL environment variable is required');
}

// 🔍 Mostrar info de conexión para debugging (sin mostrar contraseña)
try {
  const url = new URL(DATABASE_URL);
  console.log('📡 Configuración de conexión a base de datos:');
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  Database:', url.pathname.slice(1));
  console.log('  User:', url.username);
  console.log('  Password:', url.password ? '***' + url.password.slice(-4) : '⚠️  NO DEFINIDO');
  console.log('  SSL Mode:', url.searchParams.get('sslmode'));
} catch (e) {
  console.error('❌ URL de base de datos inválida:', e.message);
}

// ---
// Configuración para Google Cloud SQL
// ---
const sql = postgres(DATABASE_URL, {
  
  // Pool configuration
  max: 10,                    // Máximo de conexiones
  idle_timeout: 20,           // Tiempo antes de cerrar conexión inactiva
  connect_timeout: 30,        // Timeout de conexión inicial
  
  // Configuración adicional
  onnotice: () => {},         // Silenciar notices de PostgreSQL
  transform: {
    undefined: null           // Convertir undefined a null
  },
  
  // Metadata de la aplicación
  connection: {
    application_name: 'plat-backend-cloudrun' // Nombre actualizado
  },
  
  // Manejo de errores mejorado
  onclose: () => {
    console.log('🔌 Conexión cerrada');
  }
});

// Función mejorada para probar la conexión
export async function testConnection(maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} - Probando conexión a base de datos...`);
      
      // +++++ ¡¡¡AQUÍ ESTÁ EL ARREGLO!!! +++++
      // Cambiamos la consulta compleja por la más simple que existe.
      const result = await sql`SELECT 1 as "result"`;
      // +++++++++++++++++++++++++++++++++++++++
      
      if (result[0].result === 1) {
        console.log('✅ ¡Conexión a base de datos exitosa!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return true;
      }
      
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}/${maxRetries}`);
      console.error('  Mensaje:', error.message);
      console.error('  Código:', error.code);
      
      // Diagnóstico de errores
      if (error.code === 'ECONNREFUSED') {
        console.error('  ⚠️  ECONNREFUSED: El servidor rechaza la conexión. Verifica el Firewall de Cloud SQL.');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'CONNECT_TIMEOUT') {
        console.error('  ⚠️  TIMEOUT: Timeout de conexión.');
        console.error('  💡 Causa probable: Firewall (Redes Autorizadas) en Cloud SQL está bloqueando la IP.');
      } else if (error.code === '28P01') {
        console.error('  ⚠️  Autenticación fallida. Verifica usuario/contraseña.');
      }
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`  ⏳ Reintentando en ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('  ❌ Todos los intentos fallaron');
        console.error('  Stack:', error.stack);
        return false;
  S }
    }
  }
  
  return false;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM recibido, cerrando conexiones...');
  try {
    await sql.end({ timeout: 5 });
    console.log('✅ Conexiones cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT recibido, cerrando conexiones...');
  try {
    await sql.end({ timeout: 5 });
    console.log('✅ Conexiones cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error.message);
  }
  process.exit(0);
});

export default sql;