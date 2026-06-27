import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-[--secondary] rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[--muted-foreground]" />
      </div>
      <h3 className="font-semibold text-[--foreground] mb-2">{title}</h3>
      <p className="text-sm text-[--muted-foreground] mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
