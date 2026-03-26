import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'default' | 'warning' | 'info' | 'success';
  delay?: number;
};

const variantStyles = {
  default: 'border-border',
  warning: 'border-warning/30',
  info: 'border-info/30',
  success: 'border-success/30',
};

const iconStyles = {
  default: 'bg-secondary text-foreground',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
};

const StatCard = ({ title, value, icon: Icon, variant, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={cn('glass-card rounded-xl p-6', variantStyles[variant])}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconStyles[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-3xl font-bold font-heading">{value}</p>
  </motion.div>
);

export default StatCard;
