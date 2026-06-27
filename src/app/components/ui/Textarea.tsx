import { TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 bg-white border border-[--border] rounded-lg',
            'text-[--foreground] placeholder:text-[--muted-foreground]',
            'focus:outline-none focus:ring-2 focus:ring-[--primary-blue] focus:border-transparent',
            'disabled:bg-[--secondary] disabled:cursor-not-allowed resize-none',
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

Textarea.displayName = 'Textarea';
