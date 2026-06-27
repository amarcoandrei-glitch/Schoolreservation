import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Sparkline } from './Sparkline';

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  sparklineData?: number[];
  color?: string;
  delay?: number;
}

export function ModernStatsCard({
  title,
  value,
  icon: Icon,
  trend,
  sparklineData,
  color = '#2563EB',
  delay = 0,
}: ModernStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-6 border border-[--border] hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-[--muted-foreground] mb-2">{title}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
            className="text-3xl font-bold text-[--foreground]"
          >
            {value}
          </motion.p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>

      {sparklineData && (
        <div className="h-12 mb-3 -mx-2">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}

      {trend && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-[--muted-foreground]">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
