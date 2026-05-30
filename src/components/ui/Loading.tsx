import React from 'react';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Cargando datos...',
  fullPage = false
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-slate-100"></div>
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-brand-600 border-t-transparent animate-spin"></div>
      </div>
      <span className="text-sm font-medium text-slate-500">{message}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
