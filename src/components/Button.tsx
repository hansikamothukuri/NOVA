import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white shadow-sm shadow-orange-950/50 focus:ring-orange-500',
    secondary:
      'bg-orange-950/40 hover:bg-orange-900/50 active:bg-orange-950 text-orange-100 border border-orange-500/40 hover:border-orange-500/80 focus:ring-orange-500',
    outline:
      'bg-transparent hover:bg-orange-500/10 active:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/40 hover:border-orange-500 focus:ring-orange-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-950 focus:ring-rose-500',
    ghost:
      'bg-transparent hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 focus:ring-orange-500',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
