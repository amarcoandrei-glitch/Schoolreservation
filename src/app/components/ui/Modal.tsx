import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full mx-4 flex flex-col ${sizeClasses[size]}`}
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* Header — fixed */}
        <div className="flex items-center justify-between p-6 border-b border-[--border] shrink-0">
          <h2 className="font-semibold text-[--foreground]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[--muted-foreground] hover:text-[--foreground] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer — fixed */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[--border] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
