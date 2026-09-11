'use client'

import { useState } from 'react'
import { actualizarEstadoCita } from './actions'

interface Cita {
  id: string
  fecha: string
  hora: string
  estado: string
  tipo_mantenimiento: string
  descripcion_problema: string | null
  equipos: {
    descripcion: string
    numero_serie: string
    marca: string | null
    modelo: string | null
    tipo_equipo: string
    usuarios: {
      nombre_completo: string
      email: string
      departamentos: {
        nombre: string
      } | null
    } | null
  } | null
}

interface CitasTableProps {
  citasIniciales: Cita[]
}

const ESTADOS = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado', 'Reprogramado'] as const

const estadoColors: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-800',
  'En Proceso': 'bg-blue-100 text-blue-800',
  Completado: 'bg-green-100 text-green-800',
  Cancelado: 'bg-red-100 text-red-800',
  Reprogramado: 'bg-purple-100 text-purple-800',
}

const estadoTransitions: Record<string, string> = {
  Pendiente: 'En Proceso',
  'En Proceso': 'Completado',
  Completado: 'Completado',
  Cancelado: 'Cancelado',
  Reprogramado: 'Pendiente',
}

export function CitasTable({ citasIniciales }: CitasTableProps) {
  const [citas, setCitas] = useState<Cita[]>(citasIniciales)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleCambiarEstado = async (citaId: string, estadoActual: string) => {
    const nuevoEstado = estadoTransitions[estadoActual] || 'Pendiente'
    
    setLoadingIds(prev => new Set(prev).add(citaId))

    const result = await actualizarEstadoCita(citaId, nuevoEstado as typeof ESTADOS[number])

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(citaId)
      return next
    })

    if (result.success) {
      setCitas(prev => prev.map(c => 
        c.id === citaId ? { ...c, estado: nuevoEstado } : c
      ))
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatearHora = (hora: string) => {
    return hora.slice(0, 5)
  }

  if (citas.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas registradas</h3>
        <p className="mt-1 text-sm text-gray-500">Las citas agendadas aparecerán aquí automáticamente.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dueño</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {citas.map((cita) => {
            const equipo = cita.equipos
            const usuario = equipo?.usuarios
            const dept = usuario?.departamentos
            const isLoading = loadingIds.has(cita.id)
            const siguienteEstado = estadoTransitions[cita.estado]

            return (
              <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{usuario?.nombre_completo || '—'}</div>
                  {usuario?.email && <div className="text-xs text-gray-500">{usuario.email}</div>}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                  {dept?.nombre || '—'}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {equipo?.descripcion || equipo?.tipo_equipo || '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {equipo?.marca && `${equipo.marca} `}{equipo?.modelo || ''}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">SN: {equipo?.numero_serie || '—'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatearFecha(cita.fecha)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatearHora(cita.hora)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {cita.tipo_mantenimiento}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[cita.estado] || 'bg-gray-100 text-gray-700'}`}>
                    {cita.estado}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {cita.estado !== 'Completado' && cita.estado !== 'Cancelado' && (
                    <button
                      onClick={() => handleCambiarEstado(cita.id, cita.estado)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {siguienteEstado}
                        </>
                      )}
                    </button>
                  )}
                  {cita.estado === 'Completado' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Finalizado
                    </span>
                  )}
                  {cita.estado === 'Cancelado' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Cancelado
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}