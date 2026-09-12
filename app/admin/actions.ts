'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface CitaMantenimiento {
  id: string
  fecha: string
  hora: string
  estado: string
  tipo_mantenimiento: string
  descripcion_problema: string | null
  solucion_aplicada: string | null
  tecnico_asignado: string | null
  created_at: string
  equipos: {
    id: string
    descripcion: string
    numero_serie: string
    marca: string | null
    modelo: string | null
    tipo_equipo: string
    usuarios: {
      id: string
      nombre_completo: string
      email: string
      departamentos: {
        id: string
        nombre: string
      } | null
    } | null
  } | null
}

export async function obtenerCitasMantenimiento(): Promise<CitaMantenimiento[]> {
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

  // Supabase devuelve relaciones 1:1 como objetos (no arrays)
  return (data || []).map(cita => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = cita as any
    const equipo = Array.isArray(raw.equipos) ? raw.equipos[0] : raw.equipos
    const usuario = equipo ? (Array.isArray(equipo.usuarios) ? equipo.usuarios[0] : equipo.usuarios) : null
    const dept = usuario ? (Array.isArray(usuario.departamentos) ? usuario.departamentos[0] : usuario.departamentos) : null

    return {
      ...cita,
      equipos: equipo ? {
        ...equipo,
        usuarios: usuario ? {
          ...usuario,
          departamentos: dept || null
        } : null
      } : null
    } as CitaMantenimiento
  })
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