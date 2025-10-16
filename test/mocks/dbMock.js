// Mock de sql para evitar conexión real con Supabase
export default async function sqlMock(queryStrings, ...values) {
  // Puedes agregar lógica condicional aquí según el test
  console.log('🧪 [MOCK SQL] consulta interceptada:', queryStrings?.[0]?.slice(0, 30));
  return []; // Por defecto no devuelve nada
}
