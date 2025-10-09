import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';

// Verificar que la variable de entorno esté disponible
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  console.error('Variables de entorno disponibles:', Object.keys(process.env));
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
  console.log('  SSL: Enabled (rejectUnauthorized: false)');
} catch (e) {
  console.error('❌ URL de base de datos inválida:', e.message);
}

// Configuración específica para Supabase Transaction Pooler
const sql = postgres(DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  max_lifetime: 60 * 30,
  prepare: false,       // ⭐ CRÍTICO para Transaction Pooler
  onnotice: () => {},
  transform: {
    undefined: null
  },
  connection: {
    application_name: 'plat-backend'
  }
});

// Función mejorada para probar la conexión
export async function testConnection() {
  try {
    console.log('🔄 Probando conexión a base de datos...');
    const result = await sql`SELECT 
      NOW() as now, 
      version() as version,
      current_database() as database`;
    
    console.log('✅ Conexión exitosa a Supabase');
    console.log('  Timestamp:', result[0].now);
    console.log('  Database:', result[0].database);
    console.log('  PostgreSQL:', result[0].version.split(' ').slice(0, 2).join(' '));
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a base de datos');
    console.error('  Mensaje:', error.message);
    console.error('  Código:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('  ⚠️  ECONNREFUSED: El servidor rechaza la conexión');
      console.error('  💡 Verifica:');
      console.error('     1. Que el HOST sea correcto (debe incluir .pooler.supabase.com)');
      console.error('     2. Que el PORT sea 6543 (Transaction) o 5432 (Session/Direct)');
      console.error('     3. Que el pooler esté habilitado en Supabase');
    }
    
    console.error('  Stack completo:', error.stack);
    return false;
  }
}

process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM recibido, cerrando conexiones de base de datos...');
  await sql.end({ timeout: 5 });
  console.log('✅ Conexiones cerradas');
});

export default sql;