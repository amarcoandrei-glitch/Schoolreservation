import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={clsx('w-full border-collapse', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[--secondary] border-b border-[--border]">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[--border]">{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={clsx('hover:bg-[--secondary] transition-colors', className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-medium text-[--muted-foreground] uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: TableProps) {
  return (
    <td className={clsx('px-4 py-3 text-sm text-[--foreground]', className)}>
      {children}
    </td>
  );
}
