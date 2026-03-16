import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('hidden sm:flex items-center gap-1 text-sm text-slate-500 min-w-0 overflow-hidden', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={index} className="flex items-center gap-1 min-w-0 shrink-0 last:shrink">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-900 transition-colors truncate">
                {item.label}
              </Link>
            ) : (
              <span className={cn('truncate', isLast ? 'text-slate-900 font-medium' : '')}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
