'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function obtenerCitasMantenimiento() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('citas_mantenimiento')
    .select(`
      id,
      fecha,
      hora,
      estado,
      tipo_mantenimiento,
      descripcion_problema,
      solucion_aplicada,
      tecnico_asignado,
      created_at,
      equipos (
        id,
        descripcion,
        numero_serie,
        marca,
        modelo,
        tipo_equipo,
        usuarios (
          id,
          nombre_completo,
          email,
          departamentos (
            id,
            nombre
          )
        )
      )
    `)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  if (error) {
    console.error('Error obteniendo citas:', error)
    return []
  }

  return data || []
}

export async function actualizarEstadoCita(citaId: string, nuevoEstado: 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado' | 'Reprogramado') {
  const supabase = createServerSupabaseClient()

  const updateData: Record<string, string> = { estado: nuevoEstado }
  
  if (nuevoEstado === 'Completado') {
    updateData.fecha_completado = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('citas_mantenimiento')
    .update(updateData)
    .eq('id', citaId)
    .select('id')
    .single()

  if (error) {
    console.error('Error actualizando estado:', error)
    return { success: false, error: 'Error al actualizar el estado' }
  }

  revalidatePath('/admin')
  return { success: true, data }
}