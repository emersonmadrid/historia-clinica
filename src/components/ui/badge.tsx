import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium transition-all',
  {
    variants: {
      variant: {
        default:     'border-[var(--primary)]/20 bg-[var(--primary-subtle)] text-[var(--primary-strong)]',
        secondary:   'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--foreground-muted)]',
        destructive: 'border-red-200 bg-red-50 text-red-700',
        outline:     'border-[var(--border)] bg-white text-[var(--foreground-muted)]',
        success:     'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning:     'border-amber-200 bg-amber-50 text-amber-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
