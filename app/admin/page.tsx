import { obtenerCitasMantenimiento } from './actions'
import { CitasTable } from './CitasTable'

export const metadata = {
  title: 'Administración de Mantenimientos',
  description: 'Panel de administración para consultar y gestionar mantenimientos agendados',
}

export default async function AdminPage() {
  const citas = await obtenerCitasMantenimiento()

  const totalCitas = citas.length
  const pendientes = citas.filter(c => c.estado === 'Pendiente').length
  const enProceso = citas.filter(c => c.estado === 'En Proceso').length
  const completados = citas.filter(c => c.estado === 'Completado').length

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="mt-1 text-gray-600">Consulta y gestiona los mantenimientos programados</p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-[140px] text-center">
                <div className="text-2xl font-bold text-blue-600">{totalCitas}</div>
                <div className="text-xs text-gray-500">Total Citas</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-[140px] text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendientes}</div>
                <div className="text-xs text-gray-500">Pendientes</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-[140px] text-center">
                <div className="text-2xl font-bold text-blue-600">{enProceso}</div>
                <div className="text-xs text-gray-500">En Proceso</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 min-w-[140px] text-center">
                <div className="text-2xl font-bold text-green-600">{completados}</div>
                <div className="text-xs text-gray-500">Completados</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6 sm:hidden">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalCitas}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendientes}</div>
              <div className="text-xs text-gray-500">Pendientes</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{enProceso}</div>
              <div className="text-xs text-gray-500">En Proceso</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completados}</div>
              <div className="text-xs text-gray-500">Completados</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Listado de Mantenimientos
            </h2>
            <p className="text-sm text-gray-500 mt-1">Ordenados por fecha y hora (más próximo primero)</p>
          </div>

          <div className="p-6">
            <CitasTable citasIniciales={citas} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al formulario de agendamiento
          </a>
        </div>
      </div>
    </main>
  )
}