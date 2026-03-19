'use client'

import { useEffect, useState } from 'react'
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
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react'

interface ReportesData {
  consultasPorMes: { mes: string; cantidad: number }[]
  citasPorEstado: { estado: string; cantidad: number }[]
  pacientesPorGenero: { genero: string; cantidad: number }[]
  citasPorSemana: { semana: string; cantidad: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  Agendada: '#8ea6be',
  Confirmada: '#0284c7',
  Cancelada: '#ef4444',
  Completada: '#4a6280',
  'No asistió': '#f59e0b',
}

const PIE_COLORS = ['#0284c7', '#4a6280', '#8ea6be', '#075985']

function generateInsights(data: ReportesData): string[] {
  const insights: string[] = []

  // Trend: compare last two months of consultations
  const meses = data.consultasPorMes
  if (meses.length >= 2) {
    const last = meses[meses.length - 1].cantidad
    const prev = meses[meses.length - 2].cantidad
    if (prev > 0 && last > prev) {
      const pct = Math.round(((last - prev) / prev) * 100)
      insights.push(`Las consultas aumentaron un ${pct}% respecto al mes anterior`)
    } else if (prev > 0 && last < prev) {
      const pct = Math.round(((prev - last) / prev) * 100)
      insights.push(`Las consultas disminuyeron un ${pct}% respecto al mes anterior`)
    } else if (last === prev && last > 0) {
      insights.push(`El volumen de consultas se mantuvo estable respecto al mes anterior`)
    }
  }

  // No-show rate
  const estados = data.citasPorEstado
  const total = estados.reduce((s, e) => s + e.cantidad, 0)
  const noShow = estados.find(e => e.estado === 'No asistió')?.cantidad ?? 0
  const cancelled = estados.find(e => e.estado === 'Cancelada')?.cantidad ?? 0
  if (total > 0) {
    const noShowRate = Math.round((noShow / total) * 100)
    const cancelRate = Math.round((cancelled / total) * 100)
    if (noShowRate > 20) {
      insights.push(`Alta tasa de ausencias (${noShowRate}%): considera implementar recordatorios automáticos`)
    } else if (noShowRate > 0) {
      insights.push(`Tasa de ausencias del ${noShowRate}% — dentro del rango aceptable`)
    }
    if (cancelRate > 15) {
      insights.push(`Tasa de cancelaciones elevada (${cancelRate}%): revisar política de confirmación de citas`)
    }
  }

  // Weekly trend: last 2 weeks
  const semanas = data.citasPorSemana
  if (semanas.length >= 2) {
    const lastW = semanas[semanas.length - 1].cantidad
    const prevW = semanas[semanas.length - 2].cantidad
    if (prevW > 0 && lastW > prevW) {
      insights.push(`La actividad semanal está en alza respecto a la semana anterior`)
    }
  }

  // Completion rate
  if (total > 0) {
    const completed = estados.find(e => e.estado === 'Completada')?.cantidad ?? 0
    const completionRate = Math.round((completed / total) * 100)
    if (completionRate >= 80) {
      insights.push(`Alta tasa de citas completadas (${completionRate}%) — excelente seguimiento`)
    }
  }

  if (insights.length === 0) {
    insights.push('No hay suficientes datos para generar insights en este período')
  }

  return insights
}

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

  const pageHeader = (
    <section className="panel overflow-hidden px-5 py-6 sm:px-7">
      <p className="section-kicker">Analítica clínica</p>
      <h2 className="font-heading mt-1 text-3xl font-semibold text-foreground">Reportes</h2>
      <p className="mt-2 text-sm text-foreground-muted">Visión ejecutiva sobre productividad, citas y composición de pacientes.</p>
    </section>
  )

  if (loading) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="panel animate-pulse">
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
        <div className="panel flex flex-col items-center justify-center py-12 text-center">
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

  const insights = generateInsights(data)

  return (
    <div className="space-y-5">
      {pageHeader}

      {/* Insights IA */}
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-xl font-semibold text-foreground">Insights del período</h3>
        </div>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {insight}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Consultas por Mes</p>
            <p className="text-xs text-foreground-muted">Últimos 6 meses</p>
          </div>
          <div className="p-5">
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
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Consultas']}
                />
                <Bar dataKey="cantidad" fill="#0284c7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Citas por Estado</p>
            <p className="text-xs text-foreground-muted">Total histórico</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.citasPorEstado} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="estado"
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
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Citas']}
                />
                <Bar dataKey="cantidad" radius={[3, 3, 0, 0]}>
                  {data.citasPorEstado.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.estado] || '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Pacientes por Género</p>
            <p className="text-xs text-foreground-muted">Distribución de pacientes activos</p>
          </div>
          <div className="p-5">
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
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Pacientes']}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Citas por Semana</p>
            <p className="text-xs text-foreground-muted">Últimas 8 semanas</p>
          </div>
          <div className="p-5">
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
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value ?? 0, 'Citas']}
                />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ fill: '#0284c7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
