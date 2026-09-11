'use client'

import { useState, FormEvent } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { agendarMantenimiento } from '@/app/actions'

const TIPOS_EQUIPO = [
  'Laptop',
  'Desktop',
  'Monitor',
  'Impresora',
  'Servidor',
  'Otro',
] as const

const DEPARTAMENTOS = [
  { id: '1', nombre: 'Tecnología de la Información' },
  { id: '2', nombre: 'Recursos Humanos' },
  { id: '3', nombre: 'Finanzas' },
  { id: '4', nombre: 'Operaciones' },
  { id: '5', nombre: 'Dirección General' },
] as const

const HORAS_LABORALES = Array.from({ length: 9 }, (_, i) => {
  const h = 8 + i
  return `${h.toString().padStart(2, '0')}:00`
})

type FormData = {
  nombreCompleto: string
  idDepartamento: string
  tipoEquipo: string
  numeroSerie: string
  fecha: Date | undefined
  hora: string
}

type FieldErrors = Partial<Record<keyof FormData, string>>

export default function HomePage() {
  const [formData, setFormData] = useState<FormData>({
    nombreCompleto: '',
    idDepartamento: '',
    tipoEquipo: '',
    numeroSerie: '',
    fecha: undefined,
    hora: '09:00',
  })

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState('')

  const validateField = (name: keyof FormData, value: string | Date | undefined): string | undefined => {
    switch (name) {
      case 'nombreCompleto':
        return value && (value as string).trim().length >= 2 ? undefined : 'Mínimo 2 caracteres'
      case 'idDepartamento':
        return value ? undefined : 'Seleccione un departamento'
      case 'tipoEquipo':
        return value ? undefined : 'Seleccione un tipo de equipo'
      case 'numeroSerie':
        return value && (value as string).trim().length >= 3 ? undefined : 'Mínimo 3 caracteres'
      case 'fecha':
        return value ? undefined : 'Seleccione una fecha'
      case 'hora':
        return value ? undefined : 'Seleccione una hora'
      default:
        return undefined
    }
  }

  const handleChange = (name: keyof FormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')

    const newErrors: FieldErrors = {}
    let hasErrors = false

    ;(Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) {
        newErrors[key] = error
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    setSubmitState('loading')

    const payload = {
      nombreCompleto: formData.nombreCompleto.trim(),
      idDepartamento: formData.idDepartamento,
      tipoEquipo: formData.tipoEquipo,
      numeroSerie: formData.numeroSerie.trim().toUpperCase(),
      fecha: format(formData.fecha!, 'yyyy-MM-dd'),
      hora: formData.hora,
    }

    const result = await agendarMantenimiento(payload)

    if (result.success) {
      setSubmitState('success')
      setFormData({
        nombreCompleto: '',
        idDepartamento: '',
        tipoEquipo: '',
        numeroSerie: '',
        fecha: undefined,
        hora: '09:00',
      })
      setErrors({})
      setTimeout(() => setSubmitState('idle'), 3000)
    } else {
      setSubmitState('error')
      setServerError(result.error)
      if (result.fieldErrors) {
        const fieldErrors: FieldErrors = {}
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          fieldErrors[key as keyof FormData] = messages[0]
        })
        setErrors(fieldErrors)
      }
    }
  }

  const inputClasses = (error?: string) =>
    `w-full px-3 py-2.5 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`

  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Agendar Mantenimiento</h1>
          <p className="mt-2 text-gray-600">Programa el mantenimiento de tus equipos de cómputo</p>
        </div>

        {submitState === 'success' && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 animate-fade-in" role="alert">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">¡Mantenimiento agendado correctamente!</p>
                <p className="text-sm mt-0.5">La cita ha sido registrada en la base de datos.</p>
              </div>
            </div>
          </div>
        )}

        {submitState === 'error' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 animate-fade-in" role="alert">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Error al agendar</p>
                <p className="text-sm mt-0.5">{serverError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8" noValidate>
          <fieldset className="mb-8">
            <legend className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos del Solicitante
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="nombreCompleto" className={labelClasses}>
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={e => handleChange('nombreCompleto', e.target.value.trim())}
                  className={inputClasses(errors.nombreCompleto)}
                  placeholder="Juan Pérez García"
                  disabled={submitState === 'loading'}
                  autoComplete="name"
                />
                {errors.nombreCompleto && <p className="mt-1.5 text-sm text-red-600">{errors.nombreCompleto}</p>}
              </div>

              <div>
                <label htmlFor="idDepartamento" className={labelClasses}>
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  id="idDepartamento"
                  value={formData.idDepartamento}
                  onChange={e => handleChange('idDepartamento', e.target.value)}
                  className={inputClasses(errors.idDepartamento)}
                  disabled={submitState === 'loading'}
                >
                  <option value="">Seleccionar departamento</option>
                  {DEPARTAMENTOS.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
                {errors.idDepartamento && <p className="mt-1.5 text-sm text-red-600">{errors.idDepartamento}</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-8">
            <legend className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Datos del Equipo
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="tipoEquipo" className={labelClasses}>
                  Tipo de Equipo <span className="text-red-500">*</span>
                </label>
                <select
                  id="tipoEquipo"
                  value={formData.tipoEquipo}
                  onChange={e => handleChange('tipoEquipo', e.target.value)}
                  className={inputClasses(errors.tipoEquipo)}
                  disabled={submitState === 'loading'}
                >
                  <option value="">Seleccionar tipo</option>
                  {TIPOS_EQUIPO.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.tipoEquipo && <p className="mt-1.5 text-sm text-red-600">{errors.tipoEquipo}</p>}
              </div>

              <div>
                <label htmlFor="numeroSerie" className={labelClasses}>
                  Número de Serie / Identificador <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="numeroSerie"
                  value={formData.numeroSerie}
                  onChange={e => handleChange('numeroSerie', e.target.value.toUpperCase().trim())}
                  className={inputClasses(errors.numeroSerie)}
                  placeholder="DL5420-2024-001"
                  disabled={submitState === 'loading'}
                  autoComplete="off"
                />
                {errors.numeroSerie && <p className="mt-1.5 text-sm text-red-600">{errors.numeroSerie}</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-8">
            <legend className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Programación
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>
                  Fecha <span className="text-red-500">*</span>
                </label>
                <DayPicker
                  selected={formData.fecha}
                  onSelect={date => handleChange('fecha', date)}
                  mode="single"
                  locale={es}
                  minDate={new Date()}
                  disabledDays={date => {
                    const hoy = new Date()
                    hoy.setHours(0, 0, 0, 0)
                    return date < hoy || date.getDay() === 0 || date.getDay() === 6
                  }}
                  classNames={{
                    root: 'w-full',
                    month: 'space-y-2',
                    caption: 'flex items-center justify-between',
                    caption_label: 'text-lg font-semibold text-gray-900',
                    nav_button: 'p-2 rounded-lg hover:bg-gray-100 text-gray-600',
                    nav_button_previous: 'order-first',
                    nav_button_next: 'order-last',
                    head_row: 'flex',
                    head_cell: 'w-10 text-center text-xs font-medium text-gray-500 uppercase',
                    row: 'flex',
                    cell: 'w-10 h-10',
                    button: 'w-10 h-10 rounded-lg font-medium text-gray-900 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                    button_selected: 'bg-blue-600 text-white hover:bg-blue-700',
                    button_today: 'font-bold text-blue-600',
                    button_disabled: 'text-gray-300 cursor-not-allowed hover:bg-transparent',
                  }}
                  disabled={submitState === 'loading'}
                />
                {errors.fecha && <p className="mt-1.5 text-sm text-red-600">{errors.fecha}</p>}
                <p className="mt-1.5 text-xs text-gray-500">Solo días hábiles (Lun-Vie) y fechas futuras</p>
              </div>

              <div>
                <label htmlFor="hora" className={labelClasses}>
                  Hora <span className="text-red-500">*</span>
                </label>
                <select
                  id="hora"
                  value={formData.hora}
                  onChange={e => handleChange('hora', e.target.value)}
                  className={inputClasses(errors.hora)}
                  disabled={submitState === 'loading'}
                >
                  {HORAS_LABORALES.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {errors.hora && <p className="mt-1.5 text-sm text-red-600">{errors.hora}</p>}
                <p className="mt-1.5 text-xs text-gray-500">Horario laboral: 08:00 - 17:00</p>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitState === 'loading'}
              className="inline-flex items-center gap-2 px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitState === 'loading' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Agendando...
                </>
              ) : (
                'Agendar Mantenimiento'
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Sistema de Mantenimientos v1.0 · Next.js 14 + Tailwind CSS + Supabase
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </main>
  )
}