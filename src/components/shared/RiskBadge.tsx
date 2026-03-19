import type { RiskLevel } from '@/lib/patientRisk'
import { ShieldCheck, Shield, ShieldAlert, AlertTriangle } from 'lucide-react'

const CONFIG: Record<RiskLevel, { label: string; className: string; icon: React.ElementType }> = {
  bajo: {
    label: 'Bajo riesgo',
    className: 'bg-success/10 text-success border-success/20',
    icon: ShieldCheck,
  },
  moderado: {
    label: 'Riesgo moderado',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: Shield,
  },
  alto: {
    label: 'Alto riesgo',
    className: 'bg-danger/10 text-danger border-danger/20',
    icon: ShieldAlert,
  },
  critico: {
    label: 'CRÍTICO',
    className: 'bg-danger text-white border-danger',
    icon: AlertTriangle,
  },
}

export function RiskBadge({
  level,
  showLabel = true,
  reasons,
}: {
  level: RiskLevel
  showLabel?: boolean
  reasons?: string[]
}) {
  const { label, className, icon: Icon } = CONFIG[level]
  const title = reasons?.length ? `${label}\n• ${reasons.join('\n• ')}` : label
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-semibold ${className}`}
      title={title}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {showLabel && label}
    </span>
  )
}
