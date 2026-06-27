import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface TimelineItem {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  color: string;
}

interface TimelineActivityProps {
  items: TimelineItem[];
}

export function TimelineActivity({ items }: TimelineActivityProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-start gap-4 relative"
        >
          {/* Timeline Line */}
          {index !== items.length - 1 && (
            <div className="absolute left-[18px] top-10 w-0.5 h-full bg-[--border]" />
          )}

          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${item.color}`}
          >
            <item.icon className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-[--foreground]">{item.title}</h4>
              <span className="text-xs text-[--muted-foreground] whitespace-nowrap ml-4">
                {item.time}
              </span>
            </div>
            <p className="text-sm text-[--muted-foreground]">{item.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
