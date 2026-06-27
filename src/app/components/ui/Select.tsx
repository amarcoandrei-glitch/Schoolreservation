import { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full px-3 py-2 bg-white border border-[--border] rounded-lg appearance-none',
              'text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue]',
              'disabled:bg-[--secondary] disabled:cursor-not-allowed',
              error && 'border-[--danger] focus:ring-[--danger]',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground] pointer-events-none" />
        </div>
        {error && <p className="text-sm text-[--danger] mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
