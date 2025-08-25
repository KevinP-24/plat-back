// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

import sql, { testConnection } from './config/db.js';

async function main() {
  console.log('🔍 Probando conexión a Supabase...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Configurada' : '✗ No encontrada');
  
  try {
    // Probar conexión
    await testConnection();
    
    // Probar una consulta simple
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      LIMIT 5
    `;
    
    console.log('\n📋 Tablas en la base de datos:');
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    
    // Cerrar conexión
    await sql.end();
    console.log('\n✅ Prueba completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();