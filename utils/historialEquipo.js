import sql from '../config/db.js';

/**
 * Registra automáticamente un evento en el historial de un equipo.
 * @param {Object} params 
 * @param {number} params.equipo_id - ID del equipo afectado
 * @param {number|null} params.usuario_asignado_id - Usuario actual asignado (si aplica)
 * @param {string} params.accion - Tipo de evento ("ASIGNACION", "REASIGNACION", "ASOCIACION_TICKET")
 * @param {number} params.responsable_id - Usuario que ejecutó la acción
 */
export async function registrarHistorialEquipo({
  equipo_id,
  usuario_asignado_id = null,
  accion,
  responsable_id
}) {
  try {
    let descripcion = '';

    switch (accion) {
      case 'ASIGNACION':
        descripcion = `El equipo fue asignado al usuario con ID ${usuario_asignado_id}`;
        break;
      case 'REASIGNACION':
        descripcion = `El equipo fue reasignado a otro usuario (ID ${usuario_asignado_id})`;
        break;
      case 'ASOCIACION_TICKET':
        descripcion = `El equipo fue asociado a un ticket de soporte`;
        break;
      default:
        descripcion = `Cambio registrado automáticamente`;
    }

    await sql`
      INSERT INTO public.historial_equipo (
        equipo_id,
        usuario_asignado_id,
        accion,
        descripcion,
        responsable_id,
        fecha_registro
      )
      VALUES (
        ${equipo_id},
        ${usuario_asignado_id},
        ${accion},
        ${descripcion},
        ${responsable_id},
        NOW()
      )
    `;

    console.log(`🧾 Historial registrado [${accion}] para equipo ${equipo_id}`);
  } catch (error) {
    console.error('❌ Error registrando historial de equipo:', error);
  }
}
