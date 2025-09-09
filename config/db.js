import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';

// Verificar que la variable de entorno esté disponible
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  console.error('Variables de entorno disponibles:', Object.keys(process.env));
  throw new Error('DATABASE_URL environment variable is required');
}

// Configuración específica para Supabase
const sql = postgres(DATABASE_URL, {
  ssl: { rejectUnauthorized: false }, // 🔑 Importante para Render + Supabase
  max: 10,         // Máximo de conexiones en el pool
  idle_timeout: 20,
  connect_timeout: 10,
});

// Función para probar la conexión
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Conexión exitosa a Supabase:', result[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

export default sql; // 👈 Esto asegura que en tus controladores funcione como `sql\`SELECT...\``
