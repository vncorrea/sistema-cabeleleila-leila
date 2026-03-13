import * as React from 'react'
import { cn } from '@/lib/utils'

function Empty({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center',
        className
      )}
      {...props}
    />
  )
}

function EmptyIcon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 text-muted-foreground', className)} {...props} />
  )
}

function EmptyTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-semibold text-foreground', className)} {...props} />
}

function EmptyDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
}

export { Empty, EmptyIcon, EmptyTitle, EmptyDescription }
