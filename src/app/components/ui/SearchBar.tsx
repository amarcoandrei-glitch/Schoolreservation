import { Search } from 'lucide-react';
import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[--muted-foreground]" />
        <input
          ref={ref}
          type="search"
          className={clsx(
            'w-full pl-10 pr-4 py-2.5 bg-white border border-[--border] rounded-lg',
            'text-[--foreground] placeholder:text-[--muted-foreground]',
            'focus:outline-none focus:ring-2 focus:ring-[--primary-blue] focus:border-transparent',
            className
          )}
          onChange={(e) => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
