/**
 * Configuración de conexión a base de datos PostgreSQL con Supabase
 * 
 * Este archivo establece la conexión a la base de datos PostgreSQL usando Supabase,
 * configura el pool de conexiones y proporciona funciones de utilidad para
 * verificar la conectividad.
 * 
 * @author Tu nombre
 * @version 1.0.0
 */

// Importar y configurar dotenv para cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Importar cliente PostgreSQL
import postgres from 'postgres';

/**
 * Obtener URL de conexión a la base de datos desde variables de entorno
 * Esta variable debe estar configurada en el archivo .env o en el sistema
 */
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Validar que la variable de entorno DATABASE_URL esté configurada
 * Si no está presente, mostrar información de debug y lanzar error
 */
if (!DATABASE_URL) {
  console.error('DATABASE_URL no está configurada');
  console.error('Variables de entorno disponibles:', Object.keys(process.env));
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * Configuración específica del cliente PostgreSQL para Supabase
 * 
 * Opciones de configuración:
 * - ssl: 'require' - SSL obligatorio para conexiones a Supabase
 * - max: 10 - Número máximo de conexiones en el pool
 * - idle_timeout: 20 - Tiempo en segundos antes de cerrar conexiones inactivas
 * - connect_timeout: 10 - Tiempo límite en segundos para establecer conexión
 */
const sql = postgres(DATABASE_URL, {
  ssl: 'require',  // Supabase requiere SSL
  max: 10,         // Máximo de conexiones en el pool
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Función para probar la conectividad con la base de datos
 * 
 * Ejecuta una consulta simple SELECT NOW() para verificar que la conexión
 * esté funcionando correctamente.
 * 
 * @returns {Promise<boolean>} true si la conexión es exitosa, false en caso contrario
 * 
 * @example
 * const isConnected = await testConnection();
 * if (isConnected) {
 *   console.log('Base de datos conectada correctamente');
 * }
 */
export async function testConnection() {
  try {
    // Ejecutar consulta simple para probar la conexión
    const result = await sql`SELECT NOW()`;
    console.log('✅ Conexión exitosa a Supabase:', result[0].now);
    return true;
  } catch (error) {
    // Capturar y loggear errores de conexión
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

/**
 * Exportar instancia configurada del cliente PostgreSQL
 * 
 * Esta instancia se puede usar en toda la aplicación para ejecutar consultas SQL.
 * Incluye toda la configuración del pool de conexiones y SSL.
 * 
 * @example
 * import sql from './config/db.js';
 * const users = await sql`SELECT * FROM users WHERE active = true`;
 */
export default sql;