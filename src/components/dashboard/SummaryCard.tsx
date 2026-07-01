import React from 'react';
import { Card } from '../ui/Card';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'amber' | 'slate' | 'red';
  description?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'slate',
  description
}) => {
  const colorSchemes = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: 'text-emerald-600',
      focus: 'ring-emerald-500'
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: 'text-blue-600',
      focus: 'ring-blue-500'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: 'text-amber-600',
      focus: 'ring-amber-500'
    },
    slate: {
      bg: 'bg-slate-50 text-slate-600 border-slate-100',
      icon: 'text-slate-600',
      focus: 'ring-slate-500'
    },
    red: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      icon: 'text-rose-600',
      focus: 'ring-rose-500'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <Card hoverable className="flex items-center justify-between border-l-4 border-l-brand-600 relative overflow-hidden">
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
          {title}
        </span>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>
      
      <div className={`p-3.5 rounded-2xl border ${scheme.bg} shadow-sm shadow-slate-100`}>
        <Icon className="w-6 h-6" />
      </div>
    </Card>
  );
};
