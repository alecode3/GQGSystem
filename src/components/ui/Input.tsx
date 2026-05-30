import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 placeholder:text-slate-400 ${
          error ? 'border-red-300 bg-red-50/20 focus:ring-red-500/25 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-600 font-medium animate-fade-in">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-xs text-slate-400">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
