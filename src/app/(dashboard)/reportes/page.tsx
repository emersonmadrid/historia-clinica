'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { BarChart2 } from 'lucide-react'

interface ReportesData {
  consultasPorMes: { mes: string; cantidad: number }[]
  citasPorEstado: { estado: string; cantidad: number }[]
  pacientesPorGenero: { genero: string; cantidad: number }[]
  citasPorSemana: { semana: string; cantidad: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  Agendada: '#0EA5E9',
  Confirmada: '#22c55e',
  Cancelada: '#ef4444',
  Completada: '#8b5cf6',
  'No asistió': '#f59e0b',
}

const PIE_COLORS = ['#0EA5E9', '#ec4899', '#8b5cf6', '#22c55e']

export default function ReportesPage() {
  const [data, setData] = useState<ReportesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReportes() {
      try {
        const res = await fetch('/api/reportes')
        if (!res.ok) throw new Error('Error al cargar reportes')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchReportes()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reportes</h2>
          <p className="text-sm text-slate-500">Estadísticas del sistema</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-slate-400">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reportes</h2>
          <p className="text-sm text-slate-500">Estadísticas del sistema</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-red-500">{error || 'No se pudieron cargar los reportes'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E0F2FE]">
          <BarChart2 className="h-5 w-5 text-[#0EA5E9]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reportes</h2>
          <p className="text-sm text-slate-500">Estadísticas y métricas del sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Consultas por mes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consultas por Mes</CardTitle>
            <p className="text-xs text-slate-500">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.consultasPorMes} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Consultas']}
                />
                <Bar dataKey="cantidad" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Citas por estado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Citas por Estado</CardTitle>
            <p className="text-xs text-slate-500">Total histórico</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.citasPorEstado} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="estado"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Citas']}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {data.citasPorEstado.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.estado] || '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pacientes por género */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pacientes por Género</CardTitle>
            <p className="text-xs text-slate-500">Distribución de pacientes activos</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.pacientesPorGenero}
                  dataKey="cantidad"
                  nameKey="genero"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.pacientesPorGenero.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Pacientes']}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Citas por semana */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Citas por Semana</CardTitle>
            <p className="text-xs text-slate-500">Últimas 8 semanas</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.citasPorSemana} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Citas']}
                />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={{ fill: '#0EA5E9', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
