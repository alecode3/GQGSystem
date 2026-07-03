import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Transacción Rechazada',
  message,
  onRetry
}) => {
  return (
    <div className="gqg-alert p-5 border-red-300 bg-red-50/60 shadow-red-200/50 animate-fade-in flex gap-4">
      <div className="flex-shrink-0 text-red-500 mt-0.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-grow space-y-1">
        <h4 className="text-sm font-bold text-red-800">{title}</h4>
        <p className="text-sm text-red-700 leading-relaxed font-medium">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-xs font-semibold text-red-800 hover:text-red-900 underline transition-colors"
          >
            Reintentar operación
          </button>
        )}
      </div>
    </div>
  );
};
