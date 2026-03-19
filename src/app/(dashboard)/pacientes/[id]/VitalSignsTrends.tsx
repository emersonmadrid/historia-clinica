'use client'

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { Heart, Activity, Thermometer, Wind, Droplets, Scale, AlertTriangle } from 'lucide-react'
import { getVitalStatus } from '@/lib/vitalSignsThresholds'

interface VitalPoint {
  date: string
  bloodPressureSys: number | null
  bloodPressureDia: number | null
  heartRate: number | null
  temperature: number | null
  oxygenSat: number | null
  glucoseLevel: number | null
  weight: number | null
}

interface Props {
  vitals: VitalPoint[]
}

function Sparkline({
  data,
  dataKey,
  color,
  label,
  unit,
  icon: Icon,
  formatter,
  thresholdKey,
}: {
  data: VitalPoint[]
  dataKey: keyof VitalPoint
  color: string
  label: string
  unit: string
  icon: React.ElementType
  formatter?: (v: number) => string
  thresholdKey?: string
}) {
  const points = data
    .filter((d) => d[dataKey] !== null && d[dataKey] !== undefined)
    .map((d) => ({ value: d[dataKey] as number, date: d.date }))

  if (points.length < 2) return null

  const last = points[points.length - 1].value
  const displayVal = formatter ? formatter(last) : `${last}${unit}`
  const status = thresholdKey ? getVitalStatus(thresholdKey, last) : 'normal'
  const valueColor = status === 'critical' ? 'text-danger' : status === 'warning' ? 'text-warning' : 'text-foreground'
  const lineColor = status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : color
  const borderClass = status === 'critical' ? 'border-danger/30 bg-danger/5' : status === 'warning' ? 'border-warning/30 bg-warning/5' : 'border-border bg-surface'

  return (
    <div className={`border px-3 py-2.5 ${borderClass}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-foreground-subtle" />
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</span>
          {status !== 'normal' && (
            <AlertTriangle className={`h-3 w-3 ${status === 'critical' ? 'text-danger' : 'text-warning'}`} />
          )}
        </div>
        <span className={`text-[13px] font-semibold ${valueColor}`}>{displayVal}</span>
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const val = payload[0].value as number
              const pt = payload[0].payload as { date: string; value: number }
              return (
                <div className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-xs shadow-sm">
                  <p className="font-medium text-foreground">{formatter ? formatter(val) : `${val}${unit}`}</p>
                  <p className="text-foreground-muted">{new Date(pt.date).toLocaleDateString('es')}</p>
                </div>
              )
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-foreground-subtle">{points.length} registros</p>
    </div>
  )
}

export function VitalSignsTrends({ vitals }: Props) {
  if (vitals.length < 2) return null

  // Reverse so oldest → newest for the chart
  const sorted = [...vitals].reverse()

  const hasBP = sorted.some((v) => v.bloodPressureSys !== null)
  const hasHR = sorted.some((v) => v.heartRate !== null)
  const hasTemp = sorted.some((v) => v.temperature !== null)
  const hasO2 = sorted.some((v) => v.oxygenSat !== null)
  const hasGlucose = sorted.some((v) => v.glucoseLevel !== null)
  const hasWeight = sorted.some((v) => v.weight !== null)

  const anyTrend = hasBP || hasHR || hasTemp || hasO2 || hasGlucose || hasWeight
  if (!anyTrend) return null

  return (
    <section className="overflow-hidden border border-border bg-surface">
      <div className="border-b border-border bg-surface-alt px-3 py-2.5">
        <h2 className="text-[13px] font-semibold text-foreground">Tendencias de signos vitales</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Histórico de las últimas {vitals.length} consultas con signos vitales</p>
      </div>
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-3 p-3 gap-3">
        {hasBP && (
          <Sparkline
            data={sorted}
            dataKey="bloodPressureSys"
            color="var(--danger)"
            label="PA Sistólica"
            unit=" mmHg"
            icon={Heart}
            thresholdKey="bloodPressureSys"
          />
        )}
        {hasHR && (
          <Sparkline
            data={sorted}
            dataKey="heartRate"
            color="var(--primary)"
            label="Frec. Cardíaca"
            unit=" lpm"
            icon={Activity}
            thresholdKey="heartRate"
          />
        )}
        {hasTemp && (
          <Sparkline
            data={sorted}
            dataKey="temperature"
            color="var(--warning)"
            label="Temperatura"
            unit="°C"
            icon={Thermometer}
            thresholdKey="temperature"
          />
        )}
        {hasO2 && (
          <Sparkline
            data={sorted}
            dataKey="oxygenSat"
            color="var(--success)"
            label="SpO2"
            unit="%"
            icon={Wind}
            thresholdKey="oxygenSat"
          />
        )}
        {hasGlucose && (
          <Sparkline
            data={sorted}
            dataKey="glucoseLevel"
            color="var(--border-interactive)"
            label="Glucosa"
            unit=" mg/dL"
            icon={Droplets}
            thresholdKey="glucoseLevel"
          />
        )}
        {hasWeight && (
          <Sparkline
            data={sorted}
            dataKey="weight"
            color="var(--foreground-subtle)"
            label="Peso"
            unit=" kg"
            icon={Scale}
          />
        )}
      </div>
    </section>
  )
}
