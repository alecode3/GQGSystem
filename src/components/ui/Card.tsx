import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`gqg-panel p-6 transition-all duration-200 ${
        hoverable ? 'hover:shadow-xl hover:shadow-slate-400/50 hover:border-slate-400' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
