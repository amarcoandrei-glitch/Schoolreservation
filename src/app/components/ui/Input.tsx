import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl',
            'text-[--foreground] placeholder:text-[--muted-foreground]',
            'focus:outline-none focus:ring-2 focus:ring-[--primary-blue] focus:border-transparent',
            'disabled:bg-[--secondary] disabled:cursor-not-allowed',
            'transition-all',
            error && 'border-[--danger] focus:ring-[--danger]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-[--danger] mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
