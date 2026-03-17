import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-1 text-danger text-xs font-bold" aria-hidden="true">*</span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-foreground-subtle">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
