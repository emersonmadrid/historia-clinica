'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { RefreshCw, AlertCircle } from 'lucide-react'

interface ReportesData {
  consultasPorMes: { mes: string; cantidad: number }[]
  citasPorEstado: { estado: string; cantidad: number }[]
  pacientesPorGenero: { genero: string; cantidad: number }[]
  citasPorSemana: { semana: string; cantidad: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  Agendada: '#94a3b8',
  Confirmada: '#0D9488',
  Cancelada: '#ef4444',
  Completada: '#64748b',
  'No asistió': '#f59e0b',
}

const PIE_COLORS = ['#0D9488', '#64748b', '#94a3b8', '#0f766e']

export default function ReportesPage() {
  const [data, setData] = useState<ReportesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchReportes() {
    setLoading(true)
    setError(null)
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

  useEffect(() => { fetchReportes() }, [])

  const pageHeader = <h2 className="text-xl font-bold text-foreground">Reportes</h2>

  if (loading) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border animate-pulse border-border bg-surface">
              <div className="p-5 pb-2">
                <div className="h-4 w-32 rounded bg-background" />
                <div className="h-3 w-20 rounded mt-1.5 bg-background" />
              </div>
              <div className="px-5 pb-5">
                <div className="h-[240px] rounded-lg bg-background" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <div className="flex flex-col items-center justify-center border py-12 text-center border-border bg-surface">
          <AlertCircle className="mb-3 h-6 w-6 text-danger" />
          <h3 className="text-sm font-semibold mb-1 text-foreground">No se pudieron cargar los reportes</h3>
          <p className="text-xs mb-4 text-foreground-muted">{error}</p>
          <Button variant="outline" onClick={fetchReportes}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {pageHeader}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-none">
          <CardHeader className="border-b border-border bg-surface-alt pb-4">
            <CardTitle className="text-base">Consultas por Mes</CardTitle>
            <p className="text-xs text-foreground-muted">Últimos 6 meses</p>
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
                <Bar dataKey="cantidad" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="border-b border-border bg-surface-alt pb-4">
            <CardTitle className="text-base">Citas por Estado</CardTitle>
            <p className="text-xs text-foreground-muted">Total histórico</p>
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

        <Card className="rounded-none">
          <CardHeader className="border-b border-border bg-surface-alt pb-4">
            <CardTitle className="text-base">Pacientes por Género</CardTitle>
            <p className="text-xs text-foreground-muted">Distribución de pacientes activos</p>
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

        <Card className="rounded-none">
          <CardHeader className="border-b border-border bg-surface-alt pb-4">
            <CardTitle className="text-base">Citas por Semana</CardTitle>
            <p className="text-xs text-foreground-muted">Últimas 8 semanas</p>
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
                  stroke="#0D9488"
                  strokeWidth={2}
                  dot={{ fill: '#0D9488', r: 4 }}
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
