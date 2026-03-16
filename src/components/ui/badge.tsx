import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-sky-100 text-sky-700',
        secondary:   'bg-gray-100 text-gray-600',
        destructive: 'bg-red-100 text-red-700',
        outline:     'border border-gray-200 text-gray-600',
        success:     'bg-emerald-100 text-emerald-700',
        warning:     'bg-amber-100 text-amber-700',
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
