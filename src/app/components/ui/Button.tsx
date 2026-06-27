import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
          'border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          {
            'bg-[var(--primary-blue)] text-white shadow-[0_2px_8px_rgba(37,99,235,0.22)] hover:bg-[#1d4ed8] hover:shadow-md focus:ring-[var(--primary-blue)]':
              variant === 'primary',
            'bg-[var(--foreground)] text-white hover:bg-slate-800 focus:ring-[var(--foreground)]':
              variant === 'secondary',
            'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 focus:ring-[var(--border)]':
              variant === 'outline',
            'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-[var(--border)]':
              variant === 'ghost',
            'bg-[var(--danger)] text-white shadow-[0_2px_8px_rgba(239,68,68,0.22)] hover:bg-[#dc2626] hover:shadow-md focus:ring-[var(--danger)]':
              variant === 'danger',
            'bg-[var(--success)] text-white shadow-[0_2px_8px_rgba(16,185,129,0.22)] hover:bg-[#16a34a] hover:shadow-md focus:ring-[var(--success)]':
              variant === 'success',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
