import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
        {
          'bg-[--secondary] text-[--foreground]': variant === 'default',
          'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm': variant === 'primary',
          'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm': variant === 'success',
          'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm': variant === 'warning',
          'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm': variant === 'danger',
          'bg-[--secondary] text-[--muted-foreground]': variant === 'secondary',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
