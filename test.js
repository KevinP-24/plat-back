import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    const result = await sql`SELECT NOW() as timestamp, version() as version`;
    
    console.log('✅ Conexión exitosa!');
    console.log('🕐 Timestamp:', result[0].timestamp);
    console.log('📊 PostgreSQL Version:', result[0].version.split(' ')[0]);
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    process.exit(1);
  }
}

testConnection();