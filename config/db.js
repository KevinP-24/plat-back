import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// Verificar que la variable de entorno esté disponible
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  console.error('Variables de entorno disponibles:', Object.keys(process.env));
  throw new Error('DATABASE_URL environment variable is required');
}

// Configuración para Supabase con pg
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Supabase requiere SSL
  },
  max: 10,             // Máximo de conexiones en el pool
  idleTimeoutMillis: 20000, // 20s
  connectionTimeoutMillis: 10000, // 10s
});

// Función para probar la conexión
export async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a Supabase:', res.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

export default pool;
