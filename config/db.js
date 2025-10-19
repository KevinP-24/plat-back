import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';

// Verificar que la variable de entorno esté disponible
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  console.error('Variables de entorno disponibles:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  throw new Error('DATABASE_URL environment variable is required');
}

// 🔍 Mostrar info de conexión para debugging (sin mostrar contraseña)
try {
  const url = new URL(DATABASE_URL);
  console.log('📡 Configuración de conexión a base de datos:');
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  Database:', url.pathname.slice(1));
  console.log('  User:', url.username);
  console.log('  Password:', url.password ? '***' + url.password.slice(-4) : '⚠️  NO DEFINIDO');
  console.log('  SSL: require (Supabase)');
  console.log('  Protocol:', url.protocol);
  console.log('  Full URL Length:', DATABASE_URL.length);
} catch (e) {
  console.error('❌ URL de base de datos inválida:', e.message);
  console.error('DATABASE_URL value:', DATABASE_URL?.substring(0, 50) + '...');
}

// ⭐ Configuración optimizada para Supabase Transaction Pooler en Render
const sql = postgres(DATABASE_URL, {
  // SSL es obligatorio para Supabase
  ssl: 'require',
  
  // Pool configuration
  max: 10,                    // Máximo de conexiones
  idle_timeout: 20,           // Tiempo antes de cerrar conexión inactiva
  connect_timeout: 30,        // Timeout de conexión inicial
  max_lifetime: 60 * 30,      // Vida máxima de una conexión (30 min)
  
  // Session Pooler SÍ soporta prepared statements (mejor performance)
  prepare: true,
  
  // Configuración adicional
  onnotice: () => {},         // Silenciar notices de PostgreSQL
  transform: {
    undefined: null           // Convertir undefined a null
  },
  
  // Metadata de la aplicación
  connection: {
    application_name: 'plat-backend-render'
  },
  
  // Manejo de errores mejorado
  onclose: () => {
    console.log('🔌 Conexión cerrada');
  },
  
  // Debug solo en desarrollo
  debug: process.env.NODE_ENV === 'development' ? console.log : false
});

// Función mejorada para probar la conexión con reintentos
export async function testConnection(maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} - Probando conexión a base de datos...`);
      
      const result = await sql`
        SELECT 
          NOW() as now, 
          version() as version,
          current_database() as database,
          current_user as user
      `;
      
      console.log('✅ Conexión exitosa a Supabase');
      console.log('  Timestamp:', result[0].now);
      console.log('  Database:', result[0].database);
      console.log('  User:', result[0].user);
      console.log('  PostgreSQL:', result[0].version.split(' ').slice(0, 2).join(' '));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return true;
      
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}/${maxRetries}`);
      console.error('  Mensaje:', error.message);
      console.error('  Código:', error.code);
      
      // Diagnóstico específico según el error
      if (error.code === 'ECONNREFUSED') {
        console.error('  ⚠️  ECONNREFUSED: El servidor rechaza la conexión');
        console.error('  💡 Posibles causas:');
        console.error('     1. Firewall o IP bloqueada en Supabase');
        console.error('     2. Pooler deshabilitado o puerto incorrecto');
        console.error('     3. Host incorrecto (debe terminar en .pooler.supabase.com)');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('  ⚠️  ETIMEDOUT: Timeout de conexión');
        console.error('  💡 Posibles causas:');
        console.error('     1. Problemas de red entre Render y Supabase');
        console.error('     2. Supabase pausado (planes gratuitos se pausan)');
        console.error('     3. DNS no resuelve correctamente');
      } else if (error.code === '28P01') {
        console.error('  ⚠️  Autenticación fallida');
        console.error('  💡 Verifica usuario y contraseña en DATABASE_URL');
      } else if (error.code === '3D000') {
        console.error('  ⚠️  Base de datos no existe');
        console.error('  💡 Verifica el nombre de la base de datos');
      }
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000; // Backoff exponencial
        console.log(`  ⏳ Reintentando en ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('  ❌ Todos los intentos fallaron');
        console.error('  Stack:', error.stack);
        return false;
      }
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