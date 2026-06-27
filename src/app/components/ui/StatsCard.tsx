import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-[--primary-blue]',
    green: 'bg-green-50 text-[--success]',
    orange: 'bg-orange-50 text-[--warning]',
    red: 'bg-red-50 text-[--danger]',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[--muted-foreground] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[--foreground] mb-2">{value}</p>
          {trend && (
            <p
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-[--success]' : 'text-[--danger]'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
