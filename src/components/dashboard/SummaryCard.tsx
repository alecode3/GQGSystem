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
    <Card
      hoverable
      className="flex items-start justify-between gap-3 border-l-[6px] border-l-brand-600 min-h-[7.5rem] shadow-lg shadow-slate-200/60"
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
          {title}
        </span>
        <h3 className="text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight break-words leading-snug">
          {value}
        </h3>
        {description && (
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            {description}
          </p>
        )}
      </div>

      <div className={`p-2.5 rounded-xl border-2 shrink-0 ${scheme.bg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  );
};
