'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const formSchema = z.object({
  nombreCompleto: z.string().min(2, 'Mínimo 2 caracteres'),
  idDepartamento: z.string().uuid('Departamento inválido'),
  tipoEquipo: z.string().min(1, 'Seleccione un tipo de equipo'),
  numeroSerie: z.string().min(3, 'Mínimo 3 caracteres'),
  fecha: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  hora: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:MM)'),
})

export type FormData = z.infer<typeof formSchema>
export type ActionResult =
  | { success: true; citaId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function agendarMantenimiento(formData: FormData): Promise<ActionResult> {
  const parsed = formSchema.safeParse(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos de formulario inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data
  const supabase = createServerSupabaseClient()

  try {
    let usuarioId: string

    const { data: usuarioExistente, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nombre_completo', data.nombreCompleto)
      .single()

    if (usuarioError && usuarioError.code !== 'PGRST116') {
      console.error('Error buscando usuario:', usuarioError)
      return { success: false, error: 'Error al buscar usuario' }
    }

    if (usuarioExistente) {
      usuarioId = usuarioExistente.id
    } else {
      const { data: nuevoUsuario, error: insertUsuarioError } = await supabase
        .from('usuarios')
        .insert({
          nombre_completo: data.nombreCompleto,
          id_departamento: data.idDepartamento,
          email: `${data.nombreCompleto.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
          activo: true,
        })
        .select('id')
        .single()

      if (insertUsuarioError) {
        console.error('Error insertando usuario:', insertUsuarioError)
        return { success: false, error: 'Error al crear usuario' }
      }
      usuarioId = nuevoUsuario.id
    }

    let equipoId: string

    const { data: equipoExistente, error: equipoError } = await supabase
      .from('equipos')
      .select('id')
      .eq('numero_serie', data.numeroSerie)
      .single()

    if (equipoError && equipoError.code !== 'PGRST116') {
      console.error('Error buscando equipo:', equipoError)
      return { success: false, error: 'Error al buscar equipo' }
    }

    if (equipoExistente) {
      equipoId = equipoExistente.id

      const { error: updateEquipoError } = await supabase
        .from('equipos')
        .update({ id_usuario: usuarioId, estado: 'En Mantenimiento' })
        .eq('id', equipoId)

      if (updateEquipoError) {
        console.error('Error actualizando equipo:', updateEquipoError)
        return { success: false, error: 'Error al actualizar equipo' }
      }
    } else {
      const { data: nuevoEquipo, error: insertEquipoError } = await supabase
        .from('equipos')
        .insert({
          descripcion: data.tipoEquipo,
          numero_serie: data.numeroSerie,
          id_usuario: usuarioId,
          tipo_equipo: data.tipoEquipo,
          estado: 'En Mantenimiento',
        })
        .select('id')
        .single()

      if (insertEquipoError) {
        console.error('Error insertando equipo:', insertEquipoError)
        return { success: false, error: 'Error al registrar equipo' }
      }
      equipoId = nuevoEquipo.id
    }

    const { data: cita, error: citaError } = await supabase
      .from('citas_mantenimiento')
      .insert({
        id_equipo: equipoId,
        fecha: data.fecha,
        hora: data.hora,
        estado: 'Pendiente',
        tipo_mantenimiento: 'Preventivo',
      })
      .select('id')
      .single()

    if (citaError) {
      console.error('Error insertando cita:', citaError)
      return { success: false, error: 'Error al agendar cita' }
    }

    revalidatePath('/')

    return { success: true, citaId: cita.id }
  } catch (error) {
    console.error('Error inesperado:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function obtenerDepartamentos() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('departamentos')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')

  if (error) {
    console.error('Error obteniendo departamentos:', error)
    return []
  }

  return data || []
}