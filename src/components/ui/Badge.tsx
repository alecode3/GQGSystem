import React from 'react';

interface BadgeProps {
  status: 'PENDIENTE' | 'COBRADO' | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const isCobrado = status.toUpperCase() === 'COBRADO';
  const isPendiente = status.toUpperCase() === 'PENDIENTE';

  let colors = 'bg-slate-100 text-slate-700 border-slate-200'; // Fallback
  
  if (isCobrado) {
    colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (isPendiente) {
    colors = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${colors} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isCobrado ? 'bg-emerald-500' : isPendiente ? 'bg-amber-500' : 'bg-slate-500'}`} />
      {status}
    </span>
  );
};
